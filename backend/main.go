package main

import (
	"log"
	"mellon-harmony-api/internal/config"
	"mellon-harmony-api/internal/database"
	"mellon-harmony-api/internal/handlers"
	"mellon-harmony-api/internal/middleware"
	"mellon-harmony-api/internal/repository"
	"mellon-harmony-api/internal/service"
	"strings"

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

	// Seed initial data only in development mode
	if cfg.Environment == "development" {
		log.Println("Development mode detected - seeding initial data...")
		
		// Seed users
		if err := database.SeedUsers(db); err != nil {
			log.Printf("Warning: Failed to seed users: %v", err)
		}
		
		// Seed clients
		if err := database.SeedClients(db); err != nil {
			log.Printf("Warning: Failed to seed clients: %v", err)
		}
		
		// Seed projects (depends on clients)
		if err := database.SeedProjects(db); err != nil {
			log.Printf("Warning: Failed to seed projects: %v", err)
		}
		
		// Seed issues (depends on users and projects)
		if err := database.SeedIssues(db); err != nil {
			log.Printf("Warning: Failed to seed issues: %v", err)
		}
		
		log.Println("Seeding complete!")
	} else {
		log.Println("Production mode - skipping data seeding")
	}

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	issueRepo := repository.NewIssueRepository(db)
	commentRepo := repository.NewCommentRepository(db)
	clientRepo := repository.NewClientRepository(db)
	clientMemberRepo := repository.NewClientMemberRepository(db)
	projectRepo := repository.NewProjectRepository(db)
	notificationRepo := repository.NewNotificationRepository(db)

	// Initialize email service for password reset
	emailService := service.NewEmailService(service.EmailConfig{
		Host:     cfg.SMTPHost,
		Port:     cfg.SMTPPort,
		User:     cfg.SMTPUser,
		Password: cfg.SMTPPassword,
		From:     cfg.SMTPFrom,
		FromName: cfg.SMTPFromName,
	})

	// Initialize services
	authService := service.NewAuthService(userRepo, cfg.JWTSecret, emailService, cfg.FrontendURL)
	userService := service.NewUserService(userRepo)
	notificationService := service.NewNotificationService(notificationRepo)
	issueService := service.NewIssueService(issueRepo, userRepo)
	commentService := service.NewCommentService(commentRepo, userRepo, issueRepo, notificationService)
	clientService := service.NewClientService(clientRepo, userRepo, clientMemberRepo)
	projectService := service.NewProjectService(projectRepo, userRepo, clientMemberRepo, clientRepo)
	fileService := service.NewFileService(cfg.UploadDir)

	// Initialize handlers
	authHandler := handlers.NewAuthHandlerWithUserService(authService, userService)
	userHandler := handlers.NewUserHandler(userService, userRepo)
	notificationHandler := handlers.NewNotificationHandler(notificationService)
	issueHandler := handlers.NewIssueHandler(issueService, userRepo, notificationService, projectRepo)
	commentHandler := handlers.NewCommentHandler(commentService)
	clientHandler := handlers.NewClientHandler(clientService, userRepo, notificationService)
	projectHandler := handlers.NewProjectHandler(projectService, userRepo, notificationService, projectRepo)
	fileHandler := handlers.NewFileHandler(fileService)

	// Setup router
	router := gin.Default()

	// CORS configuration
	// Get allowed origins from environment variable or use defaults
	allowedOrigins := []string{
		"http://localhost:3000",
		"http://localhost:3001",
	}
	// Add frontend URL(s) from environment; supports comma-separated list (e.g. production + staging)
	if cfg.FrontendURL != "" {
		for _, origin := range strings.Split(cfg.FrontendURL, ",") {
			origin = strings.TrimSpace(origin)
			if origin != "" {
				allowedOrigins = append(allowedOrigins, origin)
			}
		}
	}
	if cfg.Environment == "production" && len(allowedOrigins) <= 2 {
		log.Println("⚠️  CORS: FRONTEND_URL is not set. Set FRONTEND_URL to your frontend origin (e.g. https://harmony-mellon.up.railway.app) so uploads and API calls from the browser are allowed.")
	}
	// Allow all origins in development, or specific origins in production
	corsConfig := cors.Config{
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * 3600, // 12 hours
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
		api.POST("/auth/forgot-password", authHandler.ForgotPassword)
		api.POST("/auth/reset-password", authHandler.ResetPassword)
		// Serve uploaded files (avatars, logos, attachments) without auth so <img> tags can load
		api.GET("/files/*path", fileHandler.ServeFile)
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

		// Client routes (specific /members before /:id so "members" is not captured as id)
		protected.GET("/clients", clientHandler.GetClients)
		protected.GET("/clients/:id/members", clientHandler.GetClientMembers)
		protected.POST("/clients/:id/members", clientHandler.AddClientMember)
		protected.DELETE("/clients/:id/members/:userId", clientHandler.RemoveClientMember)
		protected.GET("/clients/:id", clientHandler.GetClient)
		protected.POST("/clients", clientHandler.CreateClient)
		protected.PUT("/clients/:id", clientHandler.UpdateClient)
		protected.DELETE("/clients/:id", clientHandler.DeleteClient)

		// Project routes (bulk-monthly before :id)
		protected.GET("/projects", projectHandler.GetProjects)
		protected.POST("/projects/bulk-monthly", projectHandler.BulkCreateMonthly)
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

		// File routes (upload requires auth; GET is public above)
		protected.POST("/files/upload", fileHandler.UploadFile)
	}

	// Start server
	log.Printf("Server starting on port %s", cfg.Port)
	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
