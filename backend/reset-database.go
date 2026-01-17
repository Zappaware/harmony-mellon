//go:build ignore

package main

import (
	"log"
	"mellon-harmony-api/internal/config"
	"mellon-harmony-api/internal/database"
	"mellon-harmony-api/internal/repository"
)

// Script to reset the database by deleting all users except admin@example.com and user@example.com
// Usage: go run reset-database.go
// This script preserves the admin and user test credentials

const (
	adminEmail = "admin@example.com"
	userEmail  = "user@example.com"
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

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	projectRepo := repository.NewProjectRepository(db)
	issueRepo := repository.NewIssueRepository(db)

	// Delete all issues/tasks first (they may reference projects)
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
		if u.Email == adminEmail || u.Email == userEmail {
			preservedUsers++
			log.Printf("Preserving user: %s (%s) - %s", u.Name, u.Email, u.Role)
		} else {
			usersToDelete++
		}
	}

	// Delete users that are not admin or user
	deletedCount := 0
	if usersToDelete > 0 {
		log.Printf("Will delete %d users (preserving %d test credentials)", usersToDelete, preservedUsers)
		for _, u := range allUsers {
			if u.Email != adminEmail && u.Email != userEmail {
				if err := userRepo.Delete(u.ID); err != nil {
					log.Printf("Error deleting user %s (%s): %v", u.Name, u.Email, err)
					continue
				}
				deletedCount++
				log.Printf("Deleted user: %s (%s)", u.Name, u.Email)
			}
		}
	} else {
		log.Println("No users to delete. Only admin and user test credentials exist.")
	}

	log.Printf("\n=== Database reset complete! ===")
	log.Printf("Deleted:")
	log.Printf("  - %d users", deletedCount)
	log.Printf("  - All projects")
	log.Printf("  - All issues/tasks")
	log.Printf("\nPreserved %d test credentials:", preservedUsers)
	log.Printf("  - %s (admin)", adminEmail)
	log.Printf("  - %s (user)", userEmail)
}
