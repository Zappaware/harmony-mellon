package database

import (
	"log"
	"strings"
	"time"
	"mellon-harmony-api/internal/models"
	"mellon-harmony-api/internal/repository"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// contains checks if a string contains a substring (case-insensitive)
func contains(s, substr string) bool {
	return strings.Contains(strings.ToLower(s), strings.ToLower(substr))
}

// getUserByEmail finds a user by email, including soft-deleted (so seed can find preserved users).
func getUserByEmail(db *gorm.DB, email string) (*models.User, error) {
	var u models.User
	err := db.Unscoped().Where("email = ?", email).First(&u).Error
	if err != nil {
		return nil, err
	}
	return &u, nil
}

// SeedUsers creates initial users if they don't exist
func SeedUsers(db *gorm.DB) error {
	userRepo := repository.NewUserRepository(db)

	// Default users to create
	users := []struct {
		name     string
		email    string
		password string
		role     models.UserRole
	}{
		{
			name:     "Admin User",
			email:    "admin@example.com",
			password: "admin123",
			role:     models.RoleAdmin,
		},
		{
			name:     "Regular User",
			email:    "user@example.com",
			password: "user123",
			role:     models.RoleUser,
		},
		{
			name:     "Team Lead",
			email:    "teamlead@example.com",
			password: "teamlead123",
			role:     models.RoleTeamLead,
		},
	}

	for _, u := range users {
		// Check if user already exists
		_, err := userRepo.GetByEmail(u.email)
		if err == nil {
			log.Printf("User %s already exists, skipping...", u.email)
			continue
		}

		// Hash password
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(u.password), bcrypt.DefaultCost)
		if err != nil {
			return err
		}

		// Create user
		user := &models.User{
			Name:     u.name,
			Email:    u.email,
			Password: string(hashedPassword),
			Role:     u.role,
		}

		if err := userRepo.Create(user); err != nil {
			// Ignore duplicate key errors (user already exists) - these are harmless
			errStr := err.Error()
			if contains(errStr, "duplicate key") || contains(errStr, "23505") {
				log.Printf("User %s already exists, skipping...", u.email)
			} else {
				log.Printf("Error creating user %s: %v", u.email, err)
			}
			continue
		}

		log.Printf("Created user: %s (%s)", u.name, u.email)
	}

	return nil
}

// SeedClients creates initial clients if they don't exist
func SeedClients(db *gorm.DB) error {
	clientRepo := repository.NewClientRepository(db)

	// Get admin user to use as creator (including soft-deleted so we find preserved users)
	adminUser, err := getUserByEmail(db, "admin@example.com")
	if err != nil {
		log.Printf("Warning: Admin user not found, skipping client seeding")
		return nil
	}

	clients := []struct {
		name         string
		description  string
		email        string
		phone        string
		address      string
		contactName  string
		contactEmail string
		contactPhone string
	}{
		{
			name:         "Acme Corporation",
			description:  "Leading technology company specializing in software solutions",
			email:        "contact@acme.com",
			phone:        "+1-555-0101",
			address:      "123 Tech Street, San Francisco, CA 94105",
			contactName:  "John Smith",
			contactEmail: "john.smith@acme.com",
			contactPhone: "+1-555-0102",
		},
		{
			name:         "Global Marketing Inc",
			description:  "Full-service marketing agency providing digital and traditional marketing solutions",
			email:        "info@globalmarketing.com",
			phone:        "+1-555-0201",
			address:      "456 Marketing Ave, New York, NY 10001",
			contactName:  "Sarah Johnson",
			contactEmail: "sarah.j@globalmarketing.com",
			contactPhone: "+1-555-0202",
		},
		{
			name:         "Innovation Labs",
			description:  "Research and development company focused on emerging technologies",
			email:        "hello@innovationlabs.com",
			phone:        "+1-555-0301",
			address:      "789 Innovation Blvd, Austin, TX 78701",
			contactName:  "Michael Chen",
			contactEmail: "michael.chen@innovationlabs.com",
			contactPhone: "+1-555-0302",
		},
	}

	for _, c := range clients {
		// Check if client already exists
		existingClients, err := clientRepo.GetAll()
		if err == nil {
			exists := false
			for _, existing := range existingClients {
				if existing.Name == c.name {
					exists = true
					break
				}
			}
			if exists {
				log.Printf("Client %s already exists, skipping...", c.name)
				continue
			}
		}

		email := c.email
		phone := c.phone
		address := c.address
		contactName := c.contactName
		contactEmail := c.contactEmail
		contactPhone := c.contactPhone

		client := &models.Client{
			Name:         c.name,
			Description:  c.description,
			Email:        &email,
			Phone:        &phone,
			Address:      &address,
			ContactName:  &contactName,
			ContactEmail: &contactEmail,
			ContactPhone: &contactPhone,
			CreatedBy:    adminUser.ID,
		}

		if err := clientRepo.Create(client); err != nil {
			errStr := err.Error()
			if contains(errStr, "duplicate key") || contains(errStr, "23505") {
				log.Printf("Client %s already exists, skipping...", c.name)
			} else {
				log.Printf("Error creating client %s: %v", c.name, err)
			}
			continue
		}

		log.Printf("Created client: %s", c.name)
	}

	return nil
}

// SeedProjects creates initial projects if they don't exist
func SeedProjects(db *gorm.DB) error {
	projectRepo := repository.NewProjectRepository(db)
	clientRepo := repository.NewClientRepository(db)

	// Get users (including soft-deleted so we find preserved users after reset)
	adminUser, err := getUserByEmail(db, "admin@example.com")
	if err != nil {
		log.Printf("Warning: Admin user not found, skipping project seeding")
		return nil
	}

	teamLeadUser, err := getUserByEmail(db, "teamlead@example.com")
	if err != nil {
		log.Printf("Warning: Team lead user not found, skipping project seeding")
		return nil
	}

	// Get clients
	clients, err := clientRepo.GetAll()
	if err != nil || len(clients) == 0 {
		log.Printf("Warning: No clients found, skipping project seeding")
		return nil
	}

	now := time.Now()
	projects := []struct {
		name        string
		description string
		projectType models.ProjectType
		status      models.ProjectStatus
		progress    int
		color       string
		clientIndex int
		daysOffset  int // Days from now for start date
		deadlineDays int // Days from now for deadline
	}{
		{
			name:        "Website Redesign",
			description: "Complete redesign of the main corporate website with modern UI/UX",
			projectType: models.ProjectTypeCampana,
			status:      models.ProjectStatusInProgress,
			progress:    45,
			color:       "#3B82F6",
			clientIndex: 0,
			daysOffset:  -30,
			deadlineDays: 60,
		},
		{
			name:        "Mobile App Development",
			description: "Development of a new mobile application for iOS and Android platforms",
			projectType: models.ProjectTypeBranding,
			status:      models.ProjectStatusPlanning,
			progress:    20,
			color:       "#10B981",
			clientIndex: 1,
			daysOffset:  -10,
			deadlineDays: 120,
		},
		{
			name:        "Marketing Campaign Q1",
			description: "First quarter marketing campaign including social media, email, and content marketing",
			projectType: models.ProjectTypeCampana,
			status:      models.ProjectStatusInProgress,
			progress:    65,
			color:       "#F59E0B",
			clientIndex: 1,
			daysOffset:  -45,
			deadlineDays: 15,
		},
		{
			name:        "Product Launch Planner",
			description: "Strategic planning and execution for new product launch",
			projectType: models.ProjectTypePlanner,
			status:      models.ProjectStatusPlanning,
			progress:    15,
			color:       "#8B5CF6",
			clientIndex: 2,
			daysOffset:  0,
			deadlineDays: 90,
		},
	}

	for _, p := range projects {
		// Check if project already exists
		existingProjects, err := projectRepo.GetAll()
		if err == nil {
			exists := false
			for _, existing := range existingProjects {
				if existing.Name == p.name {
					exists = true
					break
				}
			}
			if exists {
				log.Printf("Project %s already exists, skipping...", p.name)
				continue
			}
		}

		// Get client (use first client if index is out of range)
		clientIndex := p.clientIndex
		if clientIndex >= len(clients) {
			clientIndex = 0
		}
		clientID := clients[clientIndex].ID

		startDate := now.AddDate(0, 0, p.daysOffset)
		deadline := now.AddDate(0, 0, p.deadlineDays)

		project := &models.Project{
			Name:        p.name,
			Description: p.description,
			Type:        p.projectType,
			Status:      p.status,
			Progress:    p.progress,
			Color:       p.color,
			ClientID:    &clientID,
			CreatedBy:   adminUser.ID,
			StartDate:   &startDate,
			Deadline:    &deadline,
		}

		if err := projectRepo.Create(project); err != nil {
			errStr := err.Error()
			if contains(errStr, "duplicate key") || contains(errStr, "23505") {
				log.Printf("Project %s already exists, skipping...", p.name)
			} else {
				log.Printf("Error creating project %s: %v", p.name, err)
			}
			continue
		}

		// Add team lead as project member
		if err := projectRepo.AddMember(project.ID, teamLeadUser.ID, "lead"); err != nil {
			log.Printf("Warning: Failed to add team lead to project %s: %v", p.name, err)
		}

		log.Printf("Created project: %s", p.name)
	}

	return nil
}

// SeedIssues creates initial issues/tasks if they don't exist
func SeedIssues(db *gorm.DB) error {
	issueRepo := repository.NewIssueRepository(db)
	projectRepo := repository.NewProjectRepository(db)

	// Get users (including soft-deleted so we find preserved users after reset)
	adminUser, err := getUserByEmail(db, "admin@example.com")
	if err != nil {
		log.Printf("Warning: Admin user not found, skipping issue seeding")
		return nil
	}

	userUser, err := getUserByEmail(db, "user@example.com")
	if err != nil {
		log.Printf("Warning: User not found, skipping issue seeding")
		return nil
	}

	teamLeadUser, err := getUserByEmail(db, "teamlead@example.com")
	if err != nil {
		log.Printf("Warning: Team lead user not found, skipping issue seeding")
		return nil
	}

	// Get projects
	projects, err := projectRepo.GetAll()
	if err != nil || len(projects) == 0 {
		log.Printf("Warning: No projects found, skipping issue seeding")
		return nil
	}

	now := time.Now()
	issues := []struct {
		title       string
		description string
		status      models.IssueStatus
		priority    models.IssuePriority
		projectIndex int
		assignedToEmail string
		daysOffset  int
		dueDays     int
	}{
		{
			title:       "Design homepage mockup",
			description: "Create initial design mockup for the new homepage layout including wireframes and visual design",
			status:      models.StatusInProgress,
			priority:    models.PriorityHigh,
			projectIndex: 0,
			assignedToEmail: "user@example.com",
			daysOffset: -5,
			dueDays: 10,
		},
		{
			title:       "Implement user authentication",
			description: "Develop user authentication system with login, registration, and password reset functionality",
			status:      models.StatusTodo,
			priority:    models.PriorityHigh,
			projectIndex: 1,
			assignedToEmail: "user@example.com",
			daysOffset: 0,
			dueDays: 30,
		},
		{
			title:       "Create social media content calendar",
			description: "Plan and schedule social media posts for the next month across all platforms",
			status:      models.StatusReview,
			priority:    models.PriorityMedium,
			projectIndex: 2,
			assignedToEmail: "teamlead@example.com",
			daysOffset: -10,
			dueDays: 5,
		},
		{
			title:       "Review competitor analysis",
			description: "Analyze competitor products and prepare a comprehensive report with recommendations",
			status:      models.StatusTodo,
			priority:    models.PriorityLow,
			projectIndex: 3,
			assignedToEmail: "user@example.com",
			daysOffset: 0,
			dueDays: 20,
		},
		{
			title:       "Setup development environment",
			description: "Configure development environment for the mobile app project including dependencies and tools",
			status:      models.StatusDone,
			priority:    models.PriorityMedium,
			projectIndex: 1,
			assignedToEmail: "teamlead@example.com",
			daysOffset: -20,
			dueDays: -5,
		},
		{
			title:       "Write API documentation",
			description: "Document all API endpoints with examples, request/response formats, and error codes",
			status:      models.StatusInProgress,
			priority:    models.PriorityMedium,
			projectIndex: 0,
			assignedToEmail: "user@example.com",
			daysOffset: -3,
			dueDays: 15,
		},
	}

	for _, i := range issues {
		// Check if issue already exists
		existingIssues, err := issueRepo.GetAll(map[string]interface{}{})
		if err == nil {
			exists := false
			for _, existing := range existingIssues {
				if existing.Title == i.title {
					exists = true
					break
				}
			}
			if exists {
				log.Printf("Issue %s already exists, skipping...", i.title)
				continue
			}
		}

		// Get assigned user
		var assignedUser *models.User
		if i.assignedToEmail == "user@example.com" {
			assignedUser = userUser
		} else if i.assignedToEmail == "teamlead@example.com" {
			assignedUser = teamLeadUser
		}

		// Get project
		projectIndex := i.projectIndex
		if projectIndex >= len(projects) {
			projectIndex = 0
		}
		projectID := projects[projectIndex].ID

		startDate := now.AddDate(0, 0, i.daysOffset)
		dueDate := now.AddDate(0, 0, i.dueDays)

		issue := &models.Issue{
			Title:       i.title,
			Description: i.description,
			Status:      i.status,
			Priority:    i.priority,
			CreatedBy:   adminUser.ID,
			ProjectID:   &projectID,
			StartDate:   &startDate,
			DueDate:     &dueDate,
		}

		if assignedUser != nil {
			issue.AssignedTo = &assignedUser.ID
		}

		if err := issueRepo.Create(issue); err != nil {
			errStr := err.Error()
			if contains(errStr, "duplicate key") || contains(errStr, "23505") {
				log.Printf("Issue %s already exists, skipping...", i.title)
			} else {
				log.Printf("Error creating issue %s: %v", i.title, err)
			}
			continue
		}

		log.Printf("Created issue: %s", i.title)
	}

	return nil
}
