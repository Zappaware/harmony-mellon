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
	projectService service.ProjectService
	emailService   service.EmailService
	userRepo       repository.UserRepository
}

func NewProjectHandler(projectService service.ProjectService, emailService service.EmailService, userRepo repository.UserRepository) *ProjectHandler {
	return &ProjectHandler{
		projectService: projectService,
		emailService:   emailService,
		userRepo:       userRepo,
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
	Progress    int                   `json:"progress"`
	Status      models.ProjectStatus  `json:"status"`
	StartDate   *string               `json:"start_date"`
	Deadline    *string               `json:"deadline"`
	Color       string                `json:"color"`
}

func (h *ProjectHandler) CreateProject(c *gin.Context) {
	userIDStr, _ := c.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))

	var req CreateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	project := &models.Project{
		Name:        req.Name,
		Description: req.Description,
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

	c.JSON(http.StatusCreated, project)
}

type UpdateProjectRequest struct {
	Name        *string               `json:"name"`
	Description *string               `json:"description"`
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

	// Send email to creator if there are changes (non-blocking)
	if len(changes) > 0 && h.emailService != nil {
		go func() {
			creator, err := h.userRepo.GetByID(project.CreatedBy)
			if err == nil && creator != nil {
				if err := h.emailService.SendProjectUpdatedEmail(creator.Email, project.Name, project.ID.String(), changes); err != nil {
					log.Printf("Failed to send project updated email to %s: %v", creator.Email, err)
				}
			}
		}()
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
