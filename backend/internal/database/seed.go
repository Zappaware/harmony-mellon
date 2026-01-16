package database

import (
	"log"
	"mellon-harmony-api/internal/models"
	"mellon-harmony-api/internal/repository"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

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
			log.Printf("Error creating user %s: %v", u.email, err)
			continue
		}

		log.Printf("Created user: %s (%s)", u.name, u.email)
	}

	return nil
}
