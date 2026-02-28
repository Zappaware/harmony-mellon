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
		{
			name:     "María García",
			email:    "maria@example.com",
			password: "maria123",
			role:     models.RoleUser,
		},
		{
			name:     "Carlos Rodríguez",
			email:    "carlos@example.com",
			password: "carlos123",
			role:     models.RoleUser,
		},
		{
			name:     "Ana López",
			email:    "ana@example.com",
			password: "ana123",
			role:     models.RoleTeamLead,
		},
		{
			name:     "Pedro Sánchez",
			email:    "pedro@example.com",
			password: "pedro123",
			role:     models.RoleUser,
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
			errStr := err.Error()
			if contains(errStr, "duplicate key") || contains(errStr, "23505") {
				// User exists (possibly soft-deleted from reset-database). Restore if soft-deleted.
				var existing models.User
				if dbErr := db.Unscoped().Where("email = ?", u.email).First(&existing).Error; dbErr == nil {
					// Check if soft-deleted (DeletedAt is set)
					if existing.DeletedAt.Valid {
						// Restore: clear deleted_at and update password/name/role
						if dbErr := db.Unscoped().Model(&existing).Updates(map[string]interface{}{
							"deleted_at": nil,
							"password":   string(hashedPassword),
							"name":       u.name,
							"role":       u.role,
						}).Error; dbErr == nil {
							log.Printf("Restored user: %s (%s)", u.name, u.email)
						} else {
							log.Printf("User %s already exists, skipping...", u.email)
						}
					} else {
						log.Printf("User %s already exists, skipping...", u.email)
					}
				} else {
					log.Printf("User %s already exists, skipping...", u.email)
				}
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
		{
			name:         "TechStart Ventures",
			description:  "Venture capital firm investing in early-stage tech startups",
			email:        "info@techstart.vc",
			phone:        "+1-555-0401",
			address:      "321 Startup Lane, Palo Alto, CA 94301",
			contactName:  "Emma Wilson",
			contactEmail: "emma@techstart.vc",
			contactPhone: "+1-555-0402",
		},
		{
			name:         "Green Energy Solutions",
			description:  "Renewable energy consulting and solar panel installation",
			email:        "contact@greenenergy.com",
			phone:        "+1-555-0501",
			address:      "555 Solar Way, Denver, CO 80202",
			contactName:  "David Martinez",
			contactEmail: "david.m@greenenergy.com",
			contactPhone: "+1-555-0502",
		},
		{
			name:         "Fashion Forward Co",
			description:  "Luxury fashion brand and e-commerce retailer",
			email:        "hello@fashionforward.com",
			phone:        "+1-555-0601",
			address:      "888 Style Ave, Los Angeles, CA 90028",
			contactName:  "Olivia Brown",
			contactEmail: "olivia@fashionforward.com",
			contactPhone: "+1-555-0602",
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
	jan2026 := 1
	feb2026 := 2
	year2026 := 2026

	projects := []struct {
		name           string
		description    string
		projectType    string
		status         models.ProjectStatus
		progress       int
		color          string
		clientIndex    int
		daysOffset     int
		deadlineDays   int
		planningMonth  *int
		planningYear   *int
	}{
		// Original projects - Jan/Feb 2026
		{
			name:          "Campaña Web 2025",
			description:   "Campaña de lanzamiento y rediseño web",
			projectType:   "Campaña",
			status:        models.ProjectStatusInProgress,
			progress:      45,
			color:         "#3B82F6",
			clientIndex:   0,
			daysOffset:    -30,
			deadlineDays:  60,
			planningMonth: &jan2026,
			planningYear:  &year2026,
		},
		{
			name:          "Branding Corporativo",
			description:   "Identidad de marca, brief y plan de comunicación",
			projectType:   "Branding",
			status:        models.ProjectStatusPlanning,
			progress:      20,
			color:         "#10B981",
			clientIndex:   1,
			daysOffset:    -10,
			deadlineDays:  120,
			planningMonth: &jan2026,
			planningYear:  &year2026,
		},
		{
			name:          "Campaña Redes Q1",
			description:   "Campaña en redes sociales y email marketing",
			projectType:   "Campaña",
			status:        models.ProjectStatusInProgress,
			progress:      65,
			color:         "#F59E0B",
			clientIndex:   1,
			daysOffset:    -45,
			deadlineDays:  15,
			planningMonth: &feb2026,
			planningYear:  &year2026,
		},
		{
			name:          "Planner Estratégico",
			description:   "Planificación con reportes, estrategia, diseño y fotos",
			projectType:   "Planner",
			status:        models.ProjectStatusPlanning,
			progress:      15,
			color:         "#8B5CF6",
			clientIndex:   2,
			daysOffset:    0,
			deadlineDays:  90,
			planningMonth: &jan2026,
			planningYear:  &year2026,
		},
		// Additional: 2 more Planners
		{
			name:          "Planner Q1 2026",
			description:   "Planificación estratégica primer trimestre",
			projectType:   "Planner",
			status:        models.ProjectStatusInProgress,
			progress:      35,
			color:         "#8B5CF6",
			clientIndex:   3,
			daysOffset:    -15,
			deadlineDays:  45,
			planningMonth: &jan2026,
			planningYear:  &year2026,
		},
		{
			name:          "Planner Febrero",
			description:   "Plan de contenidos febrero 2026",
			projectType:   "Planner",
			status:        models.ProjectStatusPlanning,
			progress:      10,
			color:         "#8B5CF6",
			clientIndex:   4,
			daysOffset:    0,
			deadlineDays:  60,
			planningMonth: &feb2026,
			planningYear:  &year2026,
		},
		// Additional: 2 more Brandings
		{
			name:          "Branding TechStart",
			description:   "Identidad visual para TechStart Ventures",
			projectType:   "Branding",
			status:        models.ProjectStatusPlanning,
			progress:      5,
			color:         "#10B981",
			clientIndex:   3,
			daysOffset:    0,
			deadlineDays:  90,
			planningMonth: &jan2026,
			planningYear:  &year2026,
		},
		{
			name:          "Branding Green Energy",
			description:   "Refresh de marca para Green Energy Solutions",
			projectType:   "Branding",
			status:        models.ProjectStatusInProgress,
			progress:      50,
			color:         "#10B981",
			clientIndex:   4,
			daysOffset:    -20,
			deadlineDays:  30,
			planningMonth: &feb2026,
			planningYear:  &year2026,
		},
		// Additional: 2 more Campañas
		{
			name:          "Campaña Lanzamiento Startup",
			description:   "Campaña de lanzamiento para portfolio TechStart",
			projectType:   "Campaña",
			status:        models.ProjectStatusInProgress,
			progress:      40,
			color:         "#3B82F6",
			clientIndex:   3,
			daysOffset:    -10,
			deadlineDays:  20,
			planningMonth: &jan2026,
			planningYear:  &year2026,
		},
		{
			name:          "Campaña Fashion Forward",
			description:   "Campaña primavera-verano 2026",
			projectType:   "Campaña",
			status:        models.ProjectStatusPlanning,
			progress:      0,
			color:         "#F59E0B",
			clientIndex:   5,
			daysOffset:    0,
			deadlineDays:  75,
			planningMonth: &feb2026,
			planningYear:  &year2026,
		},
		// Additional: 2 customized project types
		{
			name:          "Consultoría Estratégica",
			description:   "Consultoría de estrategia digital y transformación",
			projectType:   "Consultoría",
			status:        models.ProjectStatusInProgress,
			progress:      60,
			color:         "#6366F1",
			clientIndex:   0,
			daysOffset:    -25,
			deadlineDays:  35,
			planningMonth: &jan2026,
			planningYear:  &year2026,
		},
		{
			name:          "Producción Audiovisual",
			description:   "Producción de videos corporativos y spots",
			projectType:   "Producción",
			status:        models.ProjectStatusPlanning,
			progress:      15,
			color:         "#EC4899",
			clientIndex:   5,
			daysOffset:    0,
			deadlineDays:  90,
			planningMonth: &feb2026,
			planningYear:  &year2026,
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
			Name:          p.name,
			Description:   p.description,
			Type:          p.projectType,
			Status:        p.status,
			Progress:      p.progress,
			Color:         p.color,
			ClientID:      &clientID,
			CreatedBy:     adminUser.ID,
			StartDate:     &startDate,
			Deadline:      &deadline,
			PlanningMonth: p.planningMonth,
			PlanningYear:  p.planningYear,
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

	mariaUser, _ := getUserByEmail(db, "maria@example.com")
	carlosUser, _ := getUserByEmail(db, "carlos@example.com")
	anaUser, _ := getUserByEmail(db, "ana@example.com")
	pedroUser, _ := getUserByEmail(db, "pedro@example.com")

	// Get projects
	projects, err := projectRepo.GetAll()
	if err != nil || len(projects) == 0 {
		log.Printf("Warning: No projects found, skipping issue seeding")
		return nil
	}

	now := time.Now()
	// Tasks - projectIndex matches GetAll() order (created_at DESC): 0=Producción, 1=Consultoría,
	// 2=Campaña Fashion, 3=Campaña Lanzamiento, 4=Branding Green, 5=Branding TechStart,
	// 6=Planner Febrero, 7=Planner Q1, 8=Planner Estrat, 9=Campaña Redes, 10=Branding, 11=Campaña Web
	issues := []struct {
		title           string
		description     string
		status          models.IssueStatus
		priority        models.IssuePriority
		projectIndex    int
		taskType        string
		assignedToEmail string
		daysOffset      int
		dueDays         int
	}{
		// Campaña Web (index 11)
		{
			title:           "Tarea: Landing page",
			description:     "Diseño y contenido de la landing de la campaña web",
			status:          models.StatusInProgress,
			priority:        models.PriorityHigh,
			projectIndex:    11,
			taskType:        string(models.TaskTypeTarea),
			assignedToEmail: "user@example.com",
			daysOffset:      -5,
			dueDays:         10,
		},
		{
			title:           "Tarea: Formulario de contacto",
			description:     "Implementar formulario y validaciones",
			status:          models.StatusTodo,
			priority:        models.PriorityMedium,
			projectIndex:    11,
			taskType:        string(models.TaskTypeTarea),
			assignedToEmail: "user@example.com",
			daysOffset:      0,
			dueDays:         15,
		},
		// Branding Corporativo (index 10)
		{
			title:           "Brief de marca",
			description:     "Documento brief con objetivos y audiencia",
			status:          models.StatusTodo,
			priority:        models.PriorityHigh,
			projectIndex:    10,
			taskType:        string(models.TaskTypeBrief),
			assignedToEmail: "user@example.com",
			daysOffset:      0,
			dueDays:         14,
		},
		{
			title:           "Propuesta creativa",
			description:     "Propuesta de identidad visual y naming",
			status:          models.StatusTodo,
			priority:        models.PriorityHigh,
			projectIndex:    10,
			taskType:        string(models.TaskTypePropuesta),
			assignedToEmail: "user@example.com",
			daysOffset:      0,
			dueDays:         21,
		},
		{
			title:           "Plan de comunicación",
			description:     "Plan de canales y mensajes de marca",
			status:          models.StatusReview,
			priority:        models.PriorityMedium,
			projectIndex:    10,
			taskType:        string(models.TaskTypePlanComunicacion),
			assignedToEmail: "teamlead@example.com",
			daysOffset:      -7,
			dueDays:         7,
		},
		{
			title:           "Presentación final",
			description:     "Presentación para cliente con entregables",
			status:          models.StatusTodo,
			priority:        models.PriorityMedium,
			projectIndex:    10,
			taskType:        string(models.TaskTypePresentacion),
			assignedToEmail: "user@example.com",
			daysOffset:      0,
			dueDays:         30,
		},
		// Campaña Redes (index 9)
		{
			title:           "Tarea: Calendario redes",
			description:     "Calendario de publicaciones para redes sociales",
			status:          models.StatusReview,
			priority:        models.PriorityMedium,
			projectIndex:    9,
			taskType:        string(models.TaskTypeTarea),
			assignedToEmail: "teamlead@example.com",
			daysOffset:      -10,
			dueDays:         5,
		},
		{
			title:           "Tarea: Copy email marketing",
			description:     "Textos para envío de email marketing Q1",
			status:          models.StatusTodo,
			priority:        models.PriorityLow,
			projectIndex:    9,
			taskType:        string(models.TaskTypeTarea),
			assignedToEmail: "user@example.com",
			daysOffset:      0,
			dueDays:         10,
		},
		// Planner Estratégico (index 8)
		{
			title:           "Reportes de avance",
			description:     "Reportes semanales de avance del plan",
			status:          models.StatusTodo,
			priority:        models.PriorityMedium,
			projectIndex:    8,
			taskType:        string(models.TaskTypeReportes),
			assignedToEmail: "user@example.com",
			daysOffset:      0,
			dueDays:         20,
		},
		{
			title:           "Estrategia de lanzamiento",
			description:     "Documento de estrategia y fases",
			status:          models.StatusInProgress,
			priority:        models.PriorityHigh,
			projectIndex:    8,
			taskType:        string(models.TaskTypeEstrategia),
			assignedToEmail: "teamlead@example.com",
			daysOffset:      -5,
			dueDays:         14,
		},
		{
			title:           "Diseño de materiales",
			description:     "Diseño de piezas gráficas del plan",
			status:          models.StatusTodo,
			priority:        models.PriorityMedium,
			projectIndex:    8,
			taskType:        string(models.TaskTypeDiseno),
			assignedToEmail: "user@example.com",
			daysOffset:      0,
			dueDays:         25,
		},
		{
			title:           "Fotos y contenido visual",
			description:     "Sesión de fotos y selección de contenido visual",
			status:          models.StatusTodo,
			priority:        models.PriorityLow,
			projectIndex:    8,
			taskType:        string(models.TaskTypeFotos),
			assignedToEmail: "user@example.com",
			daysOffset:      0,
			dueDays:         30,
		},
		// New projects (indices 0-7: Producción, Consultoría, Campaña Fashion, Campaña Lanzamiento, Branding Green, Branding TechStart, Planner Febrero, Planner Q1)
		{
			title:           "Reportes Q1 TechStart",
			description:     "Reportes de avance para planificación Q1",
			status:          models.StatusInProgress,
			priority:        models.PriorityMedium,
			projectIndex:    7,
			taskType:        string(models.TaskTypeReportes),
			assignedToEmail: "maria@example.com",
			daysOffset:      -5,
			dueDays:         10,
		},
		{
			title:           "Estrategia Febrero",
			description:     "Estrategia de contenidos febrero",
			status:          models.StatusTodo,
			priority:        models.PriorityHigh,
			projectIndex:    6,
			taskType:        string(models.TaskTypeEstrategia),
			assignedToEmail: "ana@example.com",
			daysOffset:      0,
			dueDays:         14,
		},
		{
			title:           "Brief TechStart",
			description:     "Brief de marca para TechStart Ventures",
			status:          models.StatusTodo,
			priority:        models.PriorityHigh,
			projectIndex:    5,
			taskType:        string(models.TaskTypeBrief),
			assignedToEmail: "carlos@example.com",
			daysOffset:      0,
			dueDays:         14,
		},
		{
			title:           "Propuesta Green Energy",
			description:     "Propuesta creativa refresh de marca",
			status:          models.StatusReview,
			priority:        models.PriorityHigh,
			projectIndex:    4,
			taskType:        string(models.TaskTypePropuesta),
			assignedToEmail: "teamlead@example.com",
			daysOffset:      -3,
			dueDays:         7,
		},
		{
			title:           "Tarea: Landing Lanzamiento",
			description:     "Landing page para campaña de lanzamiento",
			status:          models.StatusInProgress,
			priority:        models.PriorityHigh,
			projectIndex:    3,
			taskType:        string(models.TaskTypeTarea),
			assignedToEmail: "pedro@example.com",
			daysOffset:      -2,
			dueDays:         12,
		},
		{
			title:           "Tarea: Calendario Fashion",
			description:     "Calendario editorial primavera-verano",
			status:          models.StatusTodo,
			priority:        models.PriorityMedium,
			projectIndex:    2,
			taskType:        string(models.TaskTypeTarea),
			assignedToEmail: "user@example.com",
			daysOffset:      0,
			dueDays:         21,
		},
		{
			title:           "Tarea: Análisis Consultoría",
			description:     "Análisis de estrategia digital",
			status:          models.StatusInProgress,
			priority:        models.PriorityHigh,
			projectIndex:    1,
			taskType:        string(models.TaskTypeTarea),
			assignedToEmail: "ana@example.com",
			daysOffset:      -10,
			dueDays:         5,
		},
		{
			title:           "Tarea: Guion Producción",
			description:     "Guion para videos corporativos",
			status:          models.StatusTodo,
			priority:        models.PriorityMedium,
			projectIndex:    0,
			taskType:        string(models.TaskTypeTarea),
			assignedToEmail: "carlos@example.com",
			daysOffset:      0,
			dueDays:         14,
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
		switch i.assignedToEmail {
		case "user@example.com":
			assignedUser = userUser
		case "teamlead@example.com":
			assignedUser = teamLeadUser
		case "maria@example.com":
			assignedUser = mariaUser
		case "carlos@example.com":
			assignedUser = carlosUser
		case "ana@example.com":
			assignedUser = anaUser
		case "pedro@example.com":
			assignedUser = pedroUser
		}

		// Get project
		projectIndex := i.projectIndex
		if projectIndex >= len(projects) {
			projectIndex = 0
		}
		proj := projects[projectIndex]
		projectID := proj.ID

		startDate := now.AddDate(0, 0, i.daysOffset)
		dueDate := now.AddDate(0, 0, i.dueDays)

		issue := &models.Issue{
			Title:       i.title,
			Description: i.description,
			Status:      i.status,
			Priority:    i.priority,
			CreatedBy:   adminUser.ID,
			ProjectID:   &projectID,
			TaskType:    i.taskType,
			StartDate:   &startDate,
			DueDate:     &dueDate,
		}
		if proj.ClientID != nil {
			issue.ClientID = proj.ClientID
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
