package main

import (
	"log"
	"mellon-harmony-api/internal/config"
	"mellon-harmony-api/internal/database"
	"mellon-harmony-api/internal/handlers"
	"mellon-harmony-api/internal/middleware"
	"mellon-harmony-api/internal/repository"
	"mellon-harmony-api/internal/service"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize database
	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Run migrations
	if err := database.Migrate(db); err != nil {
		log.Fatal("Failed to run migrations:", err)
	}

	// Seed initial users
	if err := database.SeedUsers(db); err != nil {
		log.Printf("Warning: Failed to seed users: %v", err)
	}

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	issueRepo := repository.NewIssueRepository(db)
	commentRepo := repository.NewCommentRepository(db)
	projectRepo := repository.NewProjectRepository(db)
	notificationRepo := repository.NewNotificationRepository(db)

	// Initialize services
	authService := service.NewAuthService(userRepo, cfg.JWTSecret)
	userService := service.NewUserService(userRepo)
	notificationService := service.NewNotificationService(notificationRepo)
	issueService := service.NewIssueService(issueRepo, userRepo)
	commentService := service.NewCommentService(commentRepo, userRepo, issueRepo)
	projectService := service.NewProjectService(projectRepo, userRepo)

	// Initialize handlers
	authHandler := handlers.NewAuthHandlerWithUserService(authService, userService)
	userHandler := handlers.NewUserHandler(userService)
	notificationHandler := handlers.NewNotificationHandler(notificationService)
	issueHandler := handlers.NewIssueHandler(issueService)
	commentHandler := handlers.NewCommentHandler(commentService)
	projectHandler := handlers.NewProjectHandler(projectService)

	// Setup router
	router := gin.Default()

	// CORS configuration
	// Get allowed origins from environment variable or use defaults
	allowedOrigins := []string{
		"http://localhost:3000",
		"http://localhost:3001",
	}
	
	// Add frontend URL from environment if provided
	if cfg.FrontendURL != "" {
		allowedOrigins = append(allowedOrigins, cfg.FrontendURL)
	}
	
	// Allow all origins in development, or specific origins in production
	corsConfig := cors.Config{
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}
	
	// In production, use specific origins; in development, allow all
	if cfg.Environment == "production" {
		corsConfig.AllowOrigins = allowedOrigins
	} else {
		corsConfig.AllowAllOrigins = true
	}
	
	router.Use(cors.New(corsConfig))

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Public routes
	api := router.Group("/api/v1")
	{
		api.POST("/auth/login", authHandler.Login)
		api.POST("/auth/register", authHandler.Register)
	}

	// Protected routes
	protected := api.Group("")
	protected.Use(middleware.AuthMiddleware(cfg.JWTSecret))
	{
		// Auth routes
		protected.GET("/auth/me", authHandler.GetMe)
		protected.POST("/auth/logout", authHandler.Logout)

		// User routes
		protected.GET("/users", userHandler.GetUsers)
		protected.GET("/users/:id", userHandler.GetUser)
		protected.PUT("/users/:id", userHandler.UpdateUser)
		protected.DELETE("/users/:id", userHandler.DeleteUser)

		// Issue routes
		protected.GET("/issues", issueHandler.GetIssues)
		protected.GET("/issues/:id", issueHandler.GetIssue)
		protected.POST("/issues", issueHandler.CreateIssue)
		protected.PUT("/issues/:id", issueHandler.UpdateIssue)
		protected.PATCH("/issues/:id/status", issueHandler.UpdateIssueStatus)
		protected.DELETE("/issues/:id", issueHandler.DeleteIssue)

		// Comment routes
		protected.GET("/issues/:id/comments", commentHandler.GetComments)
		protected.POST("/issues/:id/comments", commentHandler.CreateComment)
		protected.PUT("/comments/:id", commentHandler.UpdateComment)
		protected.DELETE("/comments/:id", commentHandler.DeleteComment)

		// Project routes
		protected.GET("/projects", projectHandler.GetProjects)
		protected.GET("/projects/:id", projectHandler.GetProject)
		protected.POST("/projects", projectHandler.CreateProject)
		protected.PUT("/projects/:id", projectHandler.UpdateProject)
		protected.DELETE("/projects/:id", projectHandler.DeleteProject)
		protected.POST("/projects/:id/members", projectHandler.AddProjectMember)
		protected.DELETE("/projects/:id/members/:userId", projectHandler.RemoveProjectMember)

		// Notification routes
		protected.GET("/notifications", notificationHandler.GetNotifications)
		protected.GET("/notifications/unread", notificationHandler.GetUnreadNotifications)
		protected.PATCH("/notifications/:id/read", notificationHandler.MarkAsRead)
		protected.PATCH("/notifications/read-all", notificationHandler.MarkAllAsRead)
		protected.DELETE("/notifications/:id", notificationHandler.DeleteNotification)
	}

	// Start server
	log.Printf("Server starting on port %s", cfg.Port)
	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
