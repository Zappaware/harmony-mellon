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

const (
	invalidClientIDError = "Invalid client ID"
)

type ClientHandler struct {
	clientService       service.ClientService
	userRepo            repository.UserRepository
	notificationService service.NotificationService
}

func NewClientHandler(clientService service.ClientService, userRepo repository.UserRepository, notificationService service.NotificationService) *ClientHandler {
	return &ClientHandler{
		clientService:       clientService,
		userRepo:            userRepo,
		notificationService: notificationService,
	}
}

func (h *ClientHandler) GetClients(c *gin.Context) {
	clients, err := h.clientService.GetAllClients()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, clients)
}

func (h *ClientHandler) GetClient(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": invalidClientIDError})
		return
	}

	client, err := h.clientService.GetClient(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Client not found"})
		return
	}

	c.JSON(http.StatusOK, client)
}

type CreateClientRequest struct {
	Name         string  `json:"name" binding:"required"`
	Description  string  `json:"description"`
	Email        *string `json:"email"`
	Phone        *string `json:"phone"`
	Address      *string `json:"address"`
	ContactName  *string `json:"contact_name"`
	ContactEmail *string `json:"contact_email"`
	ContactPhone *string `json:"contact_phone"`
}

func (h *ClientHandler) CreateClient(c *gin.Context) {
	userIDStr, _ := c.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))
	userRole, _ := c.Get("user_role")

	// Check if user is admin or team_lead
	role, ok := userRole.(string)
	if !ok || (role != string(models.RoleAdmin) && role != string(models.RoleTeamLead)) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Solo administradores y líderes de equipo pueden crear clientes"})
		return
	}

	var req CreateClientRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	client := &models.Client{
		Name:         req.Name,
		Description:  req.Description,
		Email:        req.Email,
		Phone:        req.Phone,
		Address:      req.Address,
		ContactName:  req.ContactName,
		ContactEmail: req.ContactEmail,
		ContactPhone: req.ContactPhone,
		CreatedBy:    userID,
	}

	if err := h.clientService.CreateClient(client); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Notify all admins and team leads about new client (except creator)
	if h.notificationService != nil {
		go func() {
			allUsers, err := h.userRepo.GetAll()
			if err == nil {
				creator, _ := h.userRepo.GetByID(userID)
				creatorName := "Sistema"
				if creator != nil {
					creatorName = creator.Name
				}
				clientID := &client.ID
				title := "Nuevo cliente creado: " + client.Name
				message := creatorName + " ha creado un nuevo cliente: \"" + client.Name + "\""
				for _, user := range allUsers {
					// Notify admins and team leads, but not the creator
					if (user.Role == models.RoleAdmin || user.Role == models.RoleTeamLead) && user.ID != userID {
						if err := h.notificationService.CreateNotification(user.ID, models.NotificationTypeStatus, title, message, clientID); err != nil {
							log.Printf("Failed to notify admin/team lead %s about new client: %v", user.ID, err)
						}
					}
				}
			}
		}()
	}

	c.JSON(http.StatusCreated, client)
}

type UpdateClientRequest struct {
	Name         *string `json:"name"`
	Description  *string `json:"description"`
	Email        *string `json:"email"`
	Phone        *string `json:"phone"`
	Address      *string `json:"address"`
	ContactName  *string `json:"contact_name"`
	ContactEmail *string `json:"contact_email"`
	ContactPhone *string `json:"contact_phone"`
}

func (h *ClientHandler) UpdateClient(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": invalidClientIDError})
		return
	}

	userRole, _ := c.Get("user_role")

	// Check if user is admin or team_lead
	role, ok := userRole.(string)
	if !ok || (role != string(models.RoleAdmin) && role != string(models.RoleTeamLead)) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Solo administradores y líderes de equipo pueden actualizar clientes"})
		return
	}

	var req UpdateClientRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updates := make(map[string]interface{})
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if req.Email != nil {
		updates["email"] = req.Email
	}
	if req.Phone != nil {
		updates["phone"] = req.Phone
	}
	if req.Address != nil {
		updates["address"] = req.Address
	}
	if req.ContactName != nil {
		updates["contact_name"] = req.ContactName
	}
	if req.ContactEmail != nil {
		updates["contact_email"] = req.ContactEmail
	}
	if req.ContactPhone != nil {
		updates["contact_phone"] = req.ContactPhone
	}

	client, err := h.clientService.UpdateClient(id, updates)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, client)
}

func (h *ClientHandler) DeleteClient(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": invalidClientIDError})
		return
	}

	userRole, _ := c.Get("user_role")

	// Check if user is admin or team_lead
	role, ok := userRole.(string)
	if !ok || (role != string(models.RoleAdmin) && role != string(models.RoleTeamLead)) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Solo administradores y líderes de equipo pueden eliminar clientes"})
		return
	}

	if err := h.clientService.DeleteClient(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Client deleted successfully"})
}
