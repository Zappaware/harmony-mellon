package handlers

import (
	"log"
	"mellon-harmony-api/internal/models"
	"mellon-harmony-api/internal/repository"
	"mellon-harmony-api/internal/service"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ProjectHandler struct {
	projectService      service.ProjectService
	emailService        service.EmailService
	userRepo            repository.UserRepository
	notificationService service.NotificationService
	projectRepo         repository.ProjectRepository
}

func NewProjectHandler(projectService service.ProjectService, emailService service.EmailService, userRepo repository.UserRepository, notificationService service.NotificationService, projectRepo repository.ProjectRepository) *ProjectHandler {
	return &ProjectHandler{
		projectService:      projectService,
		emailService:        emailService,
		userRepo:            userRepo,
		notificationService: notificationService,
		projectRepo:         projectRepo,
	}
}

func (h *ProjectHandler) GetProjects(c *gin.Context) {
	projects, err := h.projectService.GetAllProjects()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, projects)
}

func (h *ProjectHandler) GetProject(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	project, err := h.projectService.GetProject(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}

	c.JSON(http.StatusOK, project)
}

type CreateProjectRequest struct {
	Name        string                `json:"name" binding:"required"`
	Description string                `json:"description"`
	Type        models.ProjectType    `json:"type"`
	Progress    int                   `json:"progress"`
	Status      models.ProjectStatus  `json:"status"`
	StartDate   *string               `json:"start_date"`
	Deadline    *string               `json:"deadline"`
	Color       string                `json:"color"`
}

func (h *ProjectHandler) CreateProject(c *gin.Context) {
	userIDStr, _ := c.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))
	userRole, _ := c.Get("user_role")

	// Check if user is admin or team_lead
	role, ok := userRole.(string)
	if !ok || (role != string(models.RoleAdmin) && role != string(models.RoleTeamLead)) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Solo administradores y líderes de equipo pueden crear proyectos"})
		return
	}

	var req CreateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	project := &models.Project{
		Name:        req.Name,
		Description: req.Description,
		Type:        req.Type,
		Progress:    req.Progress,
		Status:      req.Status,
		Color:       req.Color,
		CreatedBy:   userID,
	}

	if req.StartDate != nil {
		if startDate, err := time.Parse(time.RFC3339, *req.StartDate); err == nil {
			project.StartDate = &startDate
		}
	}

	if req.Deadline != nil {
		if deadline, err := time.Parse(time.RFC3339, *req.Deadline); err == nil {
			project.Deadline = &deadline
		}
	}

	if project.Status == "" {
		project.Status = models.ProjectStatusPlanning
	}

	if project.Type == "" {
		project.Type = models.ProjectTypeCampana
	}

	if err := h.projectService.CreateProject(project); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Send email to creator (non-blocking)
	if h.emailService != nil {
		go func() {
			creator, err := h.userRepo.GetByID(userID)
			if err == nil && creator != nil {
				if err := h.emailService.SendProjectCreatedEmail(creator.Email, project.Name, project.ID.String()); err != nil {
					log.Printf("Failed to send project created email to %s: %v", creator.Email, err)
				}
			}
		}()
	}

	// Notify all admins and team leads about new project (except creator)
	if h.notificationService != nil {
		go func() {
			allUsers, err := h.userRepo.GetAll()
			if err == nil {
				creator, _ := h.userRepo.GetByID(userID)
				creatorName := "Sistema"
				if creator != nil {
					creatorName = creator.Name
				}
				projectID := &project.ID
				title := "Nuevo proyecto creado: " + project.Name
				message := creatorName + " ha creado un nuevo proyecto: \"" + project.Name + "\""
				for _, user := range allUsers {
					// Notify admins and team leads, but not the creator
					if (user.Role == models.RoleAdmin || user.Role == models.RoleTeamLead) && user.ID != userID {
						if err := h.notificationService.CreateNotification(user.ID, models.NotificationTypeStatus, title, message, projectID); err != nil {
							log.Printf("Failed to notify admin/team lead %s about new project: %v", user.ID, err)
						}
					}
				}
			}
		}()
	}

	c.JSON(http.StatusCreated, project)
}

type UpdateProjectRequest struct {
	Name        *string               `json:"name"`
	Description *string               `json:"description"`
	Type        *models.ProjectType   `json:"type"`
	Progress    *int                  `json:"progress"`
	Status      *models.ProjectStatus `json:"status"`
	StartDate   *string               `json:"start_date"`
	Deadline    *string               `json:"deadline"`
	Color       *string               `json:"color"`
}

func (h *ProjectHandler) UpdateProject(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	var req UpdateProjectRequest
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
	if req.Type != nil {
		updates["type"] = *req.Type
	}
	if req.Progress != nil {
		updates["progress"] = *req.Progress
	}
	if req.Status != nil {
		updates["status"] = *req.Status
	}
	if req.Color != nil {
		updates["color"] = *req.Color
	}

	if req.StartDate != nil {
		if startDate, err := time.Parse(time.RFC3339, *req.StartDate); err == nil {
			updates["start_date"] = &startDate
		}
	}

	if req.Deadline != nil {
		if deadline, err := time.Parse(time.RFC3339, *req.Deadline); err == nil {
			updates["deadline"] = &deadline
		}
	}

	// Get old project for comparison
	oldProject, _ := h.projectService.GetProject(id)

	project, err := h.projectService.UpdateProject(id, updates)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Track changes for email
	var changes []string
	if req.Name != nil && *req.Name != oldProject.Name {
		changes = append(changes, "Nombre actualizado")
	}
	if req.Description != nil && *req.Description != oldProject.Description {
		changes = append(changes, "Descripción actualizada")
	}
	if req.Progress != nil && *req.Progress != oldProject.Progress {
		changes = append(changes, "Progreso actualizado")
	}
	if req.Status != nil && *req.Status != oldProject.Status {
		changes = append(changes, "Estado actualizado")
	}
	if req.StartDate != nil {
		changes = append(changes, "Fecha de inicio actualizada")
	}
	if req.Deadline != nil {
		changes = append(changes, "Fecha límite actualizada")
	}

	// Notify all project members about the update
	if len(changes) > 0 {
		// Get updated project with members (reload to get fresh data with members)
		updatedProject, _ := h.projectService.GetProject(id)
		
		// Get current user who made the update
		currentUserIDStr, _ := c.Get("user_id")
		currentUserID, _ := uuid.Parse(currentUserIDStr.(string))
		currentUser, _ := h.userRepo.GetByID(currentUserID)

		if updatedProject != nil && h.notificationService != nil && currentUser != nil {
			go func() {
				projectID := &updatedProject.ID
				changesText := ""
				for i, change := range changes {
					if i > 0 {
						changesText += ", "
					}
					changesText += change
				}
				title := "Proyecto actualizado: " + updatedProject.Name
				message := currentUser.Name + " ha actualizado el proyecto: " + changesText

				// Notify creator (if not the one making the update)
				if updatedProject.CreatedBy != currentUserID {
					if err := h.notificationService.CreateNotification(updatedProject.CreatedBy, models.NotificationTypeStatus, title, message, projectID); err != nil {
						log.Printf("Failed to notify project creator: %v", err)
					}
				}

				// Notify all project members
				if updatedProject.Members != nil {
					for _, member := range updatedProject.Members {
						// Don't notify the person who made the update
						if member.UserID != currentUserID && member.UserID != updatedProject.CreatedBy {
							if err := h.notificationService.CreateNotification(member.UserID, models.NotificationTypeStatus, title, message, projectID); err != nil {
								log.Printf("Failed to notify project member %s: %v", member.UserID, err)
							}
						}
					}
				}

				// Notify all admins and team leads about project update (except updater)
				allUsers, err := h.userRepo.GetAll()
				if err == nil {
					for _, user := range allUsers {
						// Notify admins and team leads, but not the updater
						if (user.Role == models.RoleAdmin || user.Role == models.RoleTeamLead) && user.ID != currentUserID {
							if err := h.notificationService.CreateNotification(user.ID, models.NotificationTypeStatus, title, message, projectID); err != nil {
								log.Printf("Failed to notify admin/team lead %s about project update: %v", user.ID, err)
							}
						}
					}
				}
			}()
		}

		// Send email to creator if there are changes (non-blocking)
		if h.emailService != nil {
			go func() {
				creator, err := h.userRepo.GetByID(project.CreatedBy)
				if err == nil && creator != nil {
					if err := h.emailService.SendProjectUpdatedEmail(creator.Email, project.Name, project.ID.String(), changes); err != nil {
						log.Printf("Failed to send project updated email to %s: %v", creator.Email, err)
					}
				}
			}()
		}
	}

	c.JSON(http.StatusOK, project)
}

func (h *ProjectHandler) DeleteProject(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	if err := h.projectService.DeleteProject(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Project deleted successfully"})
}

type AddMemberRequest struct {
	UserID string `json:"user_id" binding:"required"`
	Role   string `json:"role"`
}

func (h *ProjectHandler) AddProjectMember(c *gin.Context) {
	projectID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	var req AddMemberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, err := uuid.Parse(req.UserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	role := req.Role
	if role == "" {
		role = "member"
	}

	if err := h.projectService.AddMember(projectID, userID, role); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Get project and current user info for notification
	project, _ := h.projectService.GetProject(projectID)
	currentUserIDStr, _ := c.Get("user_id")
	currentUserID, _ := uuid.Parse(currentUserIDStr.(string))
	currentUser, _ := h.userRepo.GetByID(currentUserID)

	// Notify the new member that they were added to the project
	if h.notificationService != nil && project != nil && currentUser != nil {
		go func() {
			projectID := &project.ID
			title := "Has sido agregado a un proyecto"
			message := currentUser.Name + " te ha agregado al proyecto \"" + project.Name + "\""
			if err := h.notificationService.CreateNotification(userID, models.NotificationTypeUser, title, message, projectID); err != nil {
				log.Printf("Failed to create notification for project member: %v", err)
			}
		}()
	}

	c.JSON(http.StatusOK, gin.H{"message": "Member added successfully"})
}

func (h *ProjectHandler) RemoveProjectMember(c *gin.Context) {
	projectID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	userID, err := uuid.Parse(c.Param("userId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	if err := h.projectService.RemoveMember(projectID, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Member removed successfully"})
}
