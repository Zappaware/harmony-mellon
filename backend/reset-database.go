//go:build ignore

package main

import (
	"log"
	"mellon-harmony-api/internal/config"
	"mellon-harmony-api/internal/database"
	"mellon-harmony-api/internal/models"
	"mellon-harmony-api/internal/repository"
)

// Script to reset the database by deleting all users except admin, user, and team lead test credentials.
// Usage: go run reset-database.go

const (
	adminEmail    = "admin@example.com"
	userEmail     = "user@example.com"
	teamLeadEmail = "teamlead@example.com"
)

func main() {
	log.Println("Starting database reset...")

	// Load configuration
	cfg := config.Load()

	// Connect to database
	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer func() {
		sqlDB, err := db.DB()
		if err == nil {
			sqlDB.Close()
		}
	}()

	log.Println("Connected to database successfully")

	// Check if we're in development mode
	if cfg.Environment != "development" {
		log.Fatal("❌ This script can only be run in development mode. Set ENVIRONMENT=development in your .env file.")
	}

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	projectRepo := repository.NewProjectRepository(db)
	issueRepo := repository.NewIssueRepository(db)
	clientRepo := repository.NewClientRepository(db)
	commentRepo := repository.NewCommentRepository(db)
	notificationRepo := repository.NewNotificationRepository(db)

	// Delete all comments first (they reference issues)
	log.Println("Deleting all comments...")
	var allComments []models.Comment
	if err := db.Find(&allComments).Error; err != nil {
		log.Printf("Warning: Failed to get comments: %v", err)
	} else {
		log.Printf("Found %d comments in database", len(allComments))
		commentsDeleted := 0
		for _, comment := range allComments {
			if err := commentRepo.Delete(comment.ID); err != nil {
				log.Printf("Error deleting comment %s: %v", comment.ID, err)
			} else {
				commentsDeleted++
			}
		}
		log.Printf("Deleted %d comments", commentsDeleted)
	}

	// Delete all notifications
	log.Println("Deleting all notifications...")
	var allNotifications []models.Notification
	if err := db.Find(&allNotifications).Error; err != nil {
		log.Printf("Warning: Failed to get notifications: %v", err)
	} else {
		log.Printf("Found %d notifications in database", len(allNotifications))
		notificationsDeleted := 0
		for _, notification := range allNotifications {
			if err := notificationRepo.Delete(notification.ID); err != nil {
				log.Printf("Error deleting notification %s: %v", notification.ID, err)
			} else {
				notificationsDeleted++
			}
		}
		log.Printf("Deleted %d notifications", notificationsDeleted)
	}

	// Delete all issues/tasks (they may reference projects)
	log.Println("Deleting all issues/tasks...")
	allIssues, err := issueRepo.GetAll(map[string]interface{}{})
	if err != nil {
		log.Printf("Warning: Failed to get issues: %v", err)
	} else {
		log.Printf("Found %d issues in database", len(allIssues))
		issuesDeleted := 0
		for _, issue := range allIssues {
			if err := issueRepo.Delete(issue.ID); err != nil {
				log.Printf("Error deleting issue %s: %v", issue.ID, err)
			} else {
				issuesDeleted++
			}
		}
		log.Printf("Deleted %d issues", issuesDeleted)
	}

	// Delete all projects
	log.Println("Deleting all projects...")
	allProjects, err := projectRepo.GetAll()
	if err != nil {
		log.Printf("Warning: Failed to get projects: %v", err)
	} else {
		log.Printf("Found %d projects in database", len(allProjects))
		projectsDeleted := 0
		for _, project := range allProjects {
			if err := projectRepo.Delete(project.ID); err != nil {
				log.Printf("Error deleting project %s: %v", project.ID, err)
			} else {
				projectsDeleted++
			}
		}
		log.Printf("Deleted %d projects", projectsDeleted)
	}

	// Delete all clients
	log.Println("Deleting all clients...")
	allClients, err := clientRepo.GetAll()
	if err != nil {
		log.Printf("Warning: Failed to get clients: %v", err)
	} else {
		log.Printf("Found %d clients in database", len(allClients))
		clientsDeleted := 0
		for _, client := range allClients {
			if err := clientRepo.Delete(client.ID); err != nil {
				log.Printf("Error deleting client %s: %v", client.ID, err)
			} else {
				clientsDeleted++
			}
		}
		log.Printf("Deleted %d clients", clientsDeleted)
	}

	// Get all users
	allUsers, err := userRepo.GetAll()
	if err != nil {
		log.Fatalf("Failed to get users: %v", err)
	}

	log.Printf("Found %d users in database", len(allUsers))

	// Count users to delete
	usersToDelete := 0
	preservedUsers := 0

	for _, u := range allUsers {
		if u.Email == adminEmail || u.Email == userEmail || u.Email == teamLeadEmail {
			preservedUsers++
			log.Printf("Preserving user: %s (%s) - %s", u.Name, u.Email, u.Role)
		} else {
			usersToDelete++
		}
	}

	// Delete users that are not admin, user, or team lead
	deletedCount := 0
	if usersToDelete > 0 {
		log.Printf("Will delete %d users (preserving %d test credentials)", usersToDelete, preservedUsers)
		for _, u := range allUsers {
			if u.Email != adminEmail && u.Email != userEmail && u.Email != teamLeadEmail {
				if err := userRepo.Delete(u.ID); err != nil {
					log.Printf("Error deleting user %s (%s): %v", u.Name, u.Email, err)
					continue
				}
				deletedCount++
				log.Printf("Deleted user: %s (%s)", u.Name, u.Email)
			}
		}
	} else {
		log.Println("No users to delete. Only admin, user, and team lead test credentials exist.")
	}

	log.Printf("\n=== Database reset complete! ===")
	log.Printf("Deleted:")
	log.Printf("  - %d users", deletedCount)
	log.Printf("  - All clients")
	log.Printf("  - All projects")
	log.Printf("  - All issues/tasks")
	log.Printf("  - All comments")
	log.Printf("  - All notifications")
	log.Printf("\nPreserved 3 test credentials:")
	log.Printf("  - %s (admin)", adminEmail)
	log.Printf("  - %s (user)", userEmail)
	log.Printf("  - %s (team lead)", teamLeadEmail)
}
