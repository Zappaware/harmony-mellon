package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port        string
	DatabaseURL string
	JWTSecret   string
	FrontendURL string
	Environment string
	// Email configuration
	SMTPHost     string
	SMTPPort     string
	SMTPUser     string
	SMTPPassword string
	SMTPFrom     string
	SMTPFromName string
}

func Load() *Config {
	// Load .env file if it exists
	_ = godotenv.Load()

	environment := getEnv("ENVIRONMENT", "development")
	jwtSecret := getEnv("JWT_SECRET", "")
	
	// Validate JWT_SECRET in production
	if environment == "production" {
		if jwtSecret == "" {
			log.Fatal("❌ JWT_SECRET must be set in production environment. Please configure it in your deployment platform (Railway/Vercel).")
		}
		// Check if using default/placeholder value
		defaultValues := []string{
			"your-secret-key-change-in-production",
			"your-secret-key",
			"test-secret-key-for-development-only-change-in-production",
			"your-secret-key-change-in-production-use-strong-secret",
		}
		for _, defaultValue := range defaultValues {
			if jwtSecret == defaultValue {
				log.Fatal("❌ JWT_SECRET cannot use default/placeholder value in production. Please generate a strong, random secret.")
			}
		}
		// Check minimum length
		if len(jwtSecret) < 32 {
			log.Fatal("❌ JWT_SECRET must be at least 32 characters long in production for security.")
		}
	} else {
		// In development, use default if not set
		if jwtSecret == "" {
			jwtSecret = "your-secret-key-change-in-production"
			log.Println("⚠️  WARNING: Using default JWT_SECRET for development. Change this in production!")
		}
	}

	return &Config{
		Port:        getEnv("PORT", "8080"),
		DatabaseURL: getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/mellon_harmony?sslmode=disable"),
		JWTSecret:   jwtSecret,
		FrontendURL: getEnv("FRONTEND_URL", ""),
		Environment: environment,
		// Email configuration
		SMTPHost:     getEnv("SMTP_HOST", "smtp.gmail.com"),
		SMTPPort:     getEnv("SMTP_PORT", "587"),
		SMTPUser:     getEnv("SMTP_USER", ""),
		SMTPPassword: getEnv("SMTP_PASSWORD", ""),
		SMTPFrom:     getEnv("SMTP_FROM", ""),
		SMTPFromName: getEnv("SMTP_FROM_NAME", "Mellon Harmony"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
