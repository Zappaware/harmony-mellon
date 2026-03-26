//go:build ignore

package main

import (
	"flag"
	"log"
	"mellon-harmony-api/internal/config"
	"mellon-harmony-api/internal/database"
	"mellon-harmony-api/internal/models"
)

// Hard reset script:
// - Physically deletes rows (Unscoped) instead of soft-deleting.
// - Runs only in development mode.
// - Preserves seed/test users by default to avoid lockout.
//
// Usage:
//   go run reset-database-hard.go --yes
//   go run reset-database-hard.go --yes --all-users

var preservedUserEmails = map[string]bool{
	"admin@example.com":    true,
	"user@example.com":     true,
	"teamlead@example.com": true,
	"maria@example.com":    true,
	"carlos@example.com":   true,
	"ana@example.com":      true,
	"pedro@example.com":    true,
}

func main() {
	confirm := flag.Bool("yes", false, "confirm hard reset")
	allUsers := flag.Bool("all-users", false, "also hard-delete all users (including preserved seed users)")
	flag.Parse()

	if !*confirm {
		log.Fatal("❌ Refusing to run without confirmation. Re-run with --yes")
	}

	cfg := config.Load()
	if cfg.Environment != "development" {
		log.Fatal("❌ This script can only run with ENVIRONMENT=development")
	}

	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer func() {
		sqlDB, err := db.DB()
		if err == nil {
			_ = sqlDB.Close()
		}
	}()

	log.Println("Starting HARD database reset...")
	log.Println("Connected to database successfully")
	log.Printf("Mode: all-users=%v", *allUsers)

	tx := db.Begin()
	if tx.Error != nil {
		log.Fatalf("Failed to begin transaction: %v", tx.Error)
	}
	defer func() {
		if r := recover(); r != nil {
			_ = tx.Rollback()
			panic(r)
		}
	}()

	// FK-safe delete order (children -> parents)
	steps := []struct {
		name string
		fn   func() error
	}{
		{
			name: "comments",
			fn: func() error {
				return tx.Unscoped().Where("1 = 1").Delete(&models.Comment{}).Error
			},
		},
		{
			name: "notifications",
			fn: func() error {
				return tx.Unscoped().Where("1 = 1").Delete(&models.Notification{}).Error
			},
		},
		{
			name: "client_members",
			fn: func() error {
				return tx.Unscoped().Where("1 = 1").Delete(&models.ClientMember{}).Error
			},
		},
		{
			name: "project_members",
			fn: func() error {
				return tx.Unscoped().Where("1 = 1").Delete(&models.ProjectMember{}).Error
			},
		},
		{
			name: "issues",
			fn: func() error {
				return tx.Unscoped().Where("1 = 1").Delete(&models.Issue{}).Error
			},
		},
		{
			name: "projects",
			fn: func() error {
				return tx.Unscoped().Where("1 = 1").Delete(&models.Project{}).Error
			},
		},
		{
			name: "clients",
			fn: func() error {
				return tx.Unscoped().Where("1 = 1").Delete(&models.Client{}).Error
			},
		},
	}

	for _, step := range steps {
		if err := step.fn(); err != nil {
			_ = tx.Rollback()
			log.Fatalf("Failed deleting %s: %v", step.name, err)
		}
		log.Printf("Hard-deleted all %s", step.name)
	}

	if *allUsers {
		if err := tx.Unscoped().Where("1 = 1").Delete(&models.User{}).Error; err != nil {
			_ = tx.Rollback()
			log.Fatalf("Failed deleting users: %v", err)
		}
		log.Printf("Hard-deleted all users")
	} else {
		if err := tx.Unscoped().
			Where("email NOT IN ?", []string{
				"admin@example.com",
				"user@example.com",
				"teamlead@example.com",
				"maria@example.com",
				"carlos@example.com",
				"ana@example.com",
				"pedro@example.com",
			}).
			Delete(&models.User{}).Error; err != nil {
			_ = tx.Rollback()
			log.Fatalf("Failed deleting non-preserved users: %v", err)
		}
		log.Printf("Hard-deleted non-preserved users")
		for email := range preservedUserEmails {
			log.Printf("Preserved user email: %s", email)
		}
	}

	if err := tx.Commit().Error; err != nil {
		_ = tx.Rollback()
		log.Fatalf("Failed to commit hard reset transaction: %v", err)
	}

	log.Println("✅ HARD reset complete.")
	log.Println("Deleted permanently: comments, notifications, client_members, project_members, issues, projects, clients")
	if *allUsers {
		log.Println("Deleted permanently: ALL users")
	} else {
		log.Println("Deleted permanently: all non-preserved users")
		log.Println("Preserved users: admin/user/teamlead/maria/carlos/ana/pedro test accounts")
	}
}

