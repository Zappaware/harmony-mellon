package handlers

import (
	"mellon-harmony-api/internal/models"
	"mellon-harmony-api/internal/repository"
	"mellon-harmony-api/internal/service"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type UserHandler struct {
	userService service.UserService
	userRepo    repository.UserRepository
}

func NewUserHandler(userService service.UserService, userRepo repository.UserRepository) *UserHandler {
	return &UserHandler{
		userService: userService,
		userRepo:    userRepo,
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
	userIDStr, _ := c.Get("user_id")
	currentUserID := userIDStr.(string)
	userRole, _ := c.Get("user_role")
	role, ok := userRole.(string)
	isAdmin := ok && role == string(models.RoleAdmin)

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var req UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Users can update their own profile (name, email, avatar). Only admins can update other users or change roles.
	isSelfUpdate := currentUserID == id.String()
	if !isSelfUpdate && !isAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Solo los administradores pueden actualizar otros usuarios"})
		return
	}
	if isSelfUpdate && !isAdmin && req.Role != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Solo los administradores pueden cambiar el rol"})
		return
	}
	// Non-admins updating self: only allow name, email, avatar
	if isSelfUpdate && !isAdmin {
		req.Role = nil
	}

	user, err := h.userService.UpdateUser(id, req.Name, req.Email, req.Role, req.Avatar)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, user)
}

func (h *UserHandler) DeleteUser(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	if err := h.userService.DeleteUser(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}
