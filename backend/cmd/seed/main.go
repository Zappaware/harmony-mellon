package main

import (
	"log"
	"mellon-harmony-api/internal/config"
	"mellon-harmony-api/internal/database"
)

func main() {
	log.Println("Starting database seeding...")

	// Load configuration
	cfg := config.Load()

	// Check if we're in development mode
	if cfg.Environment != "development" {
		log.Fatal("❌ This script can only be run in development mode. Set ENVIRONMENT=development in your .env file.")
	}

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

	// Run migrations first
	log.Println("Running migrations...")
	if err := database.Migrate(db); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Seed users
	log.Println("\n=== Seeding Users ===")
	if err := database.SeedUsers(db); err != nil {
		log.Printf("Error seeding users: %v", err)
	}

	// Seed clients
	log.Println("\n=== Seeding Clients ===")
	if err := database.SeedClients(db); err != nil {
		log.Printf("Error seeding clients: %v", err)
	}

	// Seed projects
	log.Println("\n=== Seeding Projects ===")
	if err := database.SeedProjects(db); err != nil {
		log.Printf("Error seeding projects: %v", err)
	}

	// Seed issues
	log.Println("\n=== Seeding Issues ===")
	if err := database.SeedIssues(db); err != nil {
		log.Printf("Error seeding issues: %v", err)
	}

	log.Println("\n=== Seeding Complete! ===")
}
