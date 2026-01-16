package handlers

import (
	"log"
	"mellon-harmony-api/internal/models"
	"mellon-harmony-api/internal/repository"
	"mellon-harmony-api/internal/service"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type UserHandler struct {
	userService  service.UserService
	emailService service.EmailService
	userRepo     repository.UserRepository
}

func NewUserHandler(userService service.UserService, emailService service.EmailService, userRepo repository.UserRepository) *UserHandler {
	return &UserHandler{
		userService:  userService,
		emailService: emailService,
		userRepo:     userRepo,
	}
}

func (h *UserHandler) GetUsers(c *gin.Context) {
	users, err := h.userService.GetAllUsers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, users)
}

func (h *UserHandler) GetUser(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	user, err := h.userService.GetUser(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}

type UpdateUserRequest struct {
	Name   *string          `json:"name"`
	Email  *string          `json:"email"`
	Role   *models.UserRole `json:"role"`
	Avatar *string          `json:"avatar"`
}

func (h *UserHandler) UpdateUser(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Get old user data for comparison
	oldUser, _ := h.userRepo.GetByID(id)

	var req UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.userService.UpdateUser(id, req.Name, req.Email, req.Role, req.Avatar)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Track changes for email
	var changes []string
	if req.Name != nil && *req.Name != oldUser.Name {
		changes = append(changes, "Nombre actualizado")
	}
	if req.Email != nil && *req.Email != oldUser.Email {
		changes = append(changes, "Email actualizado")
	}
	if req.Role != nil && *req.Role != oldUser.Role {
		changes = append(changes, "Rol actualizado")
	}
	if req.Avatar != nil {
		changes = append(changes, "Avatar actualizado")
	}

	// Send email notification if there are changes
	if len(changes) > 0 && h.emailService != nil {
		go func() {
			if err := h.emailService.SendUserUpdatedEmail(user.Email, user.Name, changes); err != nil {
				log.Printf("Failed to send update email to %s: %v", user.Email, err)
			}
		}()
	}

	c.JSON(http.StatusOK, user)
}

func (h *UserHandler) DeleteUser(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Get user data before deletion for email
	user, _ := h.userRepo.GetByID(id)

	if err := h.userService.DeleteUser(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Send deletion email (non-blocking)
	if user != nil && h.emailService != nil {
		go func() {
			if err := h.emailService.SendUserDeletedEmail(user.Email, user.Name); err != nil {
				log.Printf("Failed to send deletion email to %s: %v", user.Email, err)
			}
		}()
	}

	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}
