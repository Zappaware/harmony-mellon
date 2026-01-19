package handlers

import (
	"encoding/json"
	"log"
	"mellon-harmony-api/internal/models"
	"mellon-harmony-api/internal/repository"
	"mellon-harmony-api/internal/service"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type IssueHandler struct {
	issueService        service.IssueService
	emailService        service.EmailService
	userRepo            repository.UserRepository
	notificationService service.NotificationService
	projectRepo         repository.ProjectRepository
}

func NewIssueHandler(issueService service.IssueService, emailService service.EmailService, userRepo repository.UserRepository, notificationService service.NotificationService, projectRepo repository.ProjectRepository) *IssueHandler {
	return &IssueHandler{
		issueService:        issueService,
		emailService:        emailService,
		userRepo:            userRepo,
		notificationService: notificationService,
		projectRepo:         projectRepo,
	}
}

func (h *IssueHandler) GetIssues(c *gin.Context) {
	filters := make(map[string]interface{})

	if status := c.Query("status"); status != "" {
		filters["status"] = models.IssueStatus(status)
	}
	if priority := c.Query("priority"); priority != "" {
		filters["priority"] = models.IssuePriority(priority)
	}
	if assignedTo := c.Query("assigned_to"); assignedTo != "" {
		if id, err := uuid.Parse(assignedTo); err == nil {
			filters["assigned_to"] = id
		}
	}
	if projectID := c.Query("project_id"); projectID != "" {
		if id, err := uuid.Parse(projectID); err == nil {
			filters["project_id"] = id
		}
	}

	issues, err := h.issueService.GetIssues(filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Convert issues to response format with parsed attachments
	response := make([]models.IssueResponse, len(issues))
	for i, issue := range issues {
		response[i] = issue.ToResponse()
	}
	c.JSON(http.StatusOK, response)
}

func (h *IssueHandler) GetIssue(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid issue ID"})
		return
	}

	issue, err := h.issueService.GetIssue(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Issue not found"})
		return
	}

	c.JSON(http.StatusOK, issue.ToResponse())
}

type CreateIssueRequest struct {
	Title       string                `json:"title" binding:"required"`
	Description string                `json:"description" binding:"required"`
	Priority    models.IssuePriority  `json:"priority"`
	AssignedTo  *string               `json:"assigned_to"`
	ProjectID   *string               `json:"project_id"`
	StartDate   *string               `json:"start_date"`
	DueDate     *string               `json:"due_date"`
	Attachments []models.Attachment   `json:"attachments"`
}

func (h *IssueHandler) CreateIssue(c *gin.Context) {
	userIDStr, _ := c.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))

	var req CreateIssueRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	issue := &models.Issue{
		Title:       req.Title,
		Description: req.Description,
		Priority:    req.Priority,
		CreatedBy:   userID,
		Status:      models.StatusTodo,
	}
	
	// Set attachments if provided
	if len(req.Attachments) > 0 {
		issue.SetAttachments(req.Attachments)
	}

	if req.Priority == "" {
		issue.Priority = models.PriorityMedium
	}

	if req.AssignedTo != nil {
		if id, err := uuid.Parse(*req.AssignedTo); err == nil {
			issue.AssignedTo = &id
		}
	}

	if req.ProjectID != nil {
		if id, err := uuid.Parse(*req.ProjectID); err == nil {
			issue.ProjectID = &id
		}
	}

	if req.StartDate != nil {
		if startDate, err := time.Parse(time.RFC3339, *req.StartDate); err == nil {
			issue.StartDate = &startDate
		}
	}

	if req.DueDate != nil {
		if dueDate, err := time.Parse(time.RFC3339, *req.DueDate); err == nil {
			issue.DueDate = &dueDate
		}
	}

	if err := h.issueService.CreateIssue(issue); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Get creator info
	creator, _ := h.userRepo.GetByID(userID)
	issueID := &issue.ID

	// Create notifications (non-blocking)
	if h.notificationService != nil {
		// Notify assignee if assigned
		if issue.AssignedTo != nil && *issue.AssignedTo != userID {
			go func() {
				assignee, err := h.userRepo.GetByID(*issue.AssignedTo)
				if err == nil && assignee != nil {
					assignerName := "Sistema"
					if creator != nil {
						assignerName = creator.Name
					}
					title := "Nueva tarea asignada: " + issue.Title
					message := assignerName + " te ha asignado la tarea \"" + issue.Title + "\""
					if err := h.notificationService.CreateNotification(*issue.AssignedTo, models.NotificationTypeAssignment, title, message, issueID); err != nil {
						log.Printf("Failed to create assignment notification: %v", err)
					}
				}
			}()
		}

		// Notify project members if issue is part of a project
		if issue.ProjectID != nil && h.projectRepo != nil {
			go func() {
				project, err := h.projectRepo.GetByID(*issue.ProjectID)
				if err == nil && project != nil {
					members, err := h.projectRepo.GetMembers(*issue.ProjectID)
					if err == nil {
						creatorName := "Sistema"
						if creator != nil {
							creatorName = creator.Name
						}
						title := "Nueva tarea en proyecto: " + issue.Title
						message := creatorName + " ha creado una nueva tarea en el proyecto"
						for _, member := range members {
							// Don't notify the creator
							if member.UserID != userID {
								if err := h.notificationService.CreateNotification(member.UserID, models.NotificationTypeStatus, title, message, issueID); err != nil {
									log.Printf("Failed to notify project member %s: %v", member.UserID, err)
								}
							}
						}
					}
				}
			}()
		}

		// Notify all admins and team leads about new issue
		go func() {
			allUsers, err := h.userRepo.GetAll()
			if err == nil {
				creatorName := "Sistema"
				if creator != nil {
					creatorName = creator.Name
				}
				title := "Nueva tarea creada: " + issue.Title
				message := creatorName + " ha creado una nueva tarea: \"" + issue.Title + "\""
				for _, user := range allUsers {
					// Notify admins and team leads, but not the creator
					if (user.Role == models.RoleAdmin || user.Role == models.RoleTeamLead) && user.ID != userID {
						if err := h.notificationService.CreateNotification(user.ID, models.NotificationTypeStatus, title, message, issueID); err != nil {
							log.Printf("Failed to notify admin/team lead %s: %v", user.ID, err)
						}
					}
				}
			}
		}()
	}

	// Send emails (non-blocking)
	if h.emailService != nil {
		// Email to creator
		go func() {
			if creator != nil {
				if err := h.emailService.SendIssueCreatedEmail(creator.Email, issue.Title, issue.ID.String()); err != nil {
					log.Printf("Failed to send issue created email to creator %s: %v", creator.Email, err)
				}
			}
		}()

		// Email to assignee if assigned
		if issue.AssignedTo != nil {
			go func() {
				assignee, err := h.userRepo.GetByID(*issue.AssignedTo)
				if err == nil && assignee != nil && assignee.ID != userID {
					if creator != nil {
						if err := h.emailService.SendIssueAssignedEmail(assignee.Email, issue.Title, issue.ID.String(), creator.Name); err != nil {
							log.Printf("Failed to send issue assigned email to %s: %v", assignee.Email, err)
						}
					}
				}
			}()
		}
	}

	c.JSON(http.StatusCreated, issue.ToResponse())
}

type UpdateIssueRequest struct {
	Title       *string               `json:"title"`
	Description *string               `json:"description"`
	Priority    *models.IssuePriority  `json:"priority"`
	AssignedTo  *string               `json:"assigned_to"`
	ProjectID   *string               `json:"project_id"`
	StartDate   *string               `json:"start_date"`
	DueDate     *string               `json:"due_date"`
	Attachments *[]models.Attachment  `json:"attachments"`
}

func (h *IssueHandler) UpdateIssue(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid issue ID"})
		return
	}

	var req UpdateIssueRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updates := make(map[string]interface{})
	if req.Title != nil {
		updates["title"] = *req.Title
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if req.Priority != nil {
		updates["priority"] = *req.Priority
	}
	if req.AssignedTo != nil {
		if id, err := uuid.Parse(*req.AssignedTo); err == nil {
			updates["assigned_to"] = &id
		}
	}
	if req.ProjectID != nil {
		if id, err := uuid.Parse(*req.ProjectID); err == nil {
			updates["project_id"] = &id
		}
	}

	if req.StartDate != nil {
		if startDate, err := time.Parse(time.RFC3339, *req.StartDate); err == nil {
			updates["start_date"] = &startDate
		}
	}

	if req.DueDate != nil {
		if dueDate, err := time.Parse(time.RFC3339, *req.DueDate); err == nil {
			updates["due_date"] = &dueDate
		}
	}
	if req.Attachments != nil {
		// Convert attachments to JSON string
		if data, err := json.Marshal(*req.Attachments); err == nil {
			updates["attachments"] = string(data)
		}
	}

	// Get old issue for comparison
	oldIssue, _ := h.issueService.GetIssue(id)

	issue, err := h.issueService.UpdateIssue(id, updates)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Track changes for email
	var changes []string
	if req.Title != nil && *req.Title != oldIssue.Title {
		changes = append(changes, "Título actualizado")
	}
	if req.Description != nil && *req.Description != oldIssue.Description {
		changes = append(changes, "Descripción actualizada")
	}
	if req.Priority != nil && *req.Priority != oldIssue.Priority {
		changes = append(changes, "Prioridad actualizada")
	}
	if req.AssignedTo != nil {
		oldAssignedID := ""
		if oldIssue.AssignedTo != nil {
			oldAssignedID = oldIssue.AssignedTo.String()
		}
		if *req.AssignedTo != oldAssignedID {
			changes = append(changes, "Asignación actualizada")
		}
	}
	if req.StartDate != nil {
		changes = append(changes, "Fecha de inicio actualizada")
	}
	if req.DueDate != nil {
		changes = append(changes, "Fecha de vencimiento actualizada")
	}

	// Get current user who made the update
	currentUserIDStr, _ := c.Get("user_id")
	currentUserID, _ := uuid.Parse(currentUserIDStr.(string))
	currentUser, _ := h.userRepo.GetByID(currentUserID)

	// Send notifications and emails (non-blocking)
	if len(changes) > 0 {
		// Get users
		creator, _ := h.userRepo.GetByID(issue.CreatedBy)
		
		changesText := ""
		for i, change := range changes {
			if i > 0 {
				changesText += ", "
			}
			changesText += change
		}
		
		issueID := &issue.ID
		title := "Tarea actualizada: " + issue.Title
		message := ""
		if currentUser != nil {
			message = currentUser.Name + " ha actualizado la tarea: " + changesText
		} else {
			message = "La tarea ha sido actualizada: " + changesText
		}

		// Notify creator (if not the one making the update)
		if h.notificationService != nil && creator != nil && issue.CreatedBy != currentUserID {
			go func() {
				if err := h.notificationService.CreateNotification(issue.CreatedBy, models.NotificationTypeStatus, title, message, issueID); err != nil {
					log.Printf("Failed to notify issue creator: %v", err)
				}
			}()
		}

		// Notify assignee if assigned (and not the creator)
		if issue.AssignedTo != nil && h.notificationService != nil {
			go func() {
				assignee, err := h.userRepo.GetByID(*issue.AssignedTo)
				if err == nil && assignee != nil && *issue.AssignedTo != currentUserID && *issue.AssignedTo != issue.CreatedBy {
					if err := h.notificationService.CreateNotification(*issue.AssignedTo, models.NotificationTypeStatus, title, message, issueID); err != nil {
						log.Printf("Failed to notify issue assignee: %v", err)
					}
				}
			}()
		}

		// If assignment changed, send assignment notification
		if req.AssignedTo != nil {
			oldAssignedID := ""
			if oldIssue.AssignedTo != nil {
				oldAssignedID = oldIssue.AssignedTo.String()
			}
			if *req.AssignedTo != oldAssignedID && *req.AssignedTo != "" {
				go func() {
					assignee, err := h.userRepo.GetByID(*issue.AssignedTo)
					if err == nil && assignee != nil && h.notificationService != nil {
						assignerName := "Sistema"
						if currentUser != nil {
							assignerName = currentUser.Name
						}
						assignmentTitle := "Tarea asignada: " + issue.Title
						assignmentMessage := assignerName + " te ha asignado la tarea \"" + issue.Title + "\""
						if err := h.notificationService.CreateNotification(*issue.AssignedTo, models.NotificationTypeAssignment, assignmentTitle, assignmentMessage, issueID); err != nil {
							log.Printf("Failed to create assignment notification: %v", err)
						}
					}
				}()
			}
		}

		// Notify all admins and team leads about issue update ONLY if the updater is a regular user
		// If admin/team lead makes the change, only notify people involved (not other admins/team leads)
		if h.notificationService != nil && currentUser != nil && currentUser.Role == models.RoleUser {
			go func() {
				allUsers, err := h.userRepo.GetAll()
				if err == nil {
					for _, user := range allUsers {
						// Notify admins and team leads, but not the updater
						if (user.Role == models.RoleAdmin || user.Role == models.RoleTeamLead) && user.ID != currentUserID {
							if err := h.notificationService.CreateNotification(user.ID, models.NotificationTypeStatus, title, message, issueID); err != nil {
								log.Printf("Failed to notify admin/team lead %s: %v", user.ID, err)
							}
						}
					}
				}
			}()
		}

		// Send emails (non-blocking)
		if h.emailService != nil {
			// Email to creator
			go func() {
				if creator != nil {
					if err := h.emailService.SendIssueUpdatedEmail(creator.Email, issue.Title, issue.ID.String(), changes); err != nil {
						log.Printf("Failed to send issue updated email to creator %s: %v", creator.Email, err)
					}
				}
			}()

			// Email to assignee if assigned
			if issue.AssignedTo != nil {
				go func() {
					assignee, err := h.userRepo.GetByID(*issue.AssignedTo)
					if err == nil && assignee != nil {
						if err := h.emailService.SendIssueUpdatedEmail(assignee.Email, issue.Title, issue.ID.String(), changes); err != nil {
							log.Printf("Failed to send issue updated email to assignee %s: %v", assignee.Email, err)
						}
					}
				}()
			}

			// If assignment changed, send assignment email
			if req.AssignedTo != nil {
				oldAssignedID := ""
				if oldIssue.AssignedTo != nil {
					oldAssignedID = oldIssue.AssignedTo.String()
				}
				if *req.AssignedTo != oldAssignedID && *req.AssignedTo != "" {
					go func() {
						assignee, err := h.userRepo.GetByID(*issue.AssignedTo)
						if err == nil && assignee != nil {
							assignerName := "Sistema"
							if creator != nil {
								assignerName = creator.Name
							}
							if err := h.emailService.SendIssueAssignedEmail(assignee.Email, issue.Title, issue.ID.String(), assignerName); err != nil {
								log.Printf("Failed to send issue assigned email to %s: %v", assignee.Email, err)
							}
						}
					}()
				}
			}
		}
	}

	c.JSON(http.StatusOK, issue.ToResponse())
}

type UpdateStatusRequest struct {
	Status models.IssueStatus `json:"status" binding:"required"`
}

func (h *IssueHandler) UpdateIssueStatus(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid issue ID"})
		return
	}

	var req UpdateStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get old issue to compare status
	oldIssue, _ := h.issueService.GetIssue(id)

	issue, err := h.issueService.UpdateIssueStatus(id, req.Status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Get current user who made the update
	currentUserIDStr, _ := c.Get("user_id")
	currentUserID, _ := uuid.Parse(currentUserIDStr.(string))
	currentUser, _ := h.userRepo.GetByID(currentUserID)

	// Notify users if status changed
	if oldIssue != nil && oldIssue.Status != req.Status && h.notificationService != nil {
		go func() {
			issueID := &issue.ID
			statusText := ""
			switch req.Status {
			case models.StatusTodo:
				statusText = "Por Hacer"
			case models.StatusInProgress:
				statusText = "En Progreso"
			case models.StatusReview:
				statusText = "En Revisión"
			case models.StatusDone:
				statusText = "Completada"
			default:
				statusText = string(req.Status)
			}

			title := "Estado de tarea actualizado: " + issue.Title
			message := ""
			if currentUser != nil {
				message = currentUser.Name + " ha cambiado el estado de la tarea a: " + statusText
			} else {
				message = "El estado de la tarea ha sido cambiado a: " + statusText
			}

			// Notify creator (if not the one making the update)
			if issue.CreatedBy != currentUserID {
				if err := h.notificationService.CreateNotification(issue.CreatedBy, models.NotificationTypeStatus, title, message, issueID); err != nil {
					log.Printf("Failed to notify issue creator about status change: %v", err)
				}
			}

			// Notify assignee if assigned (and not the one making the update)
			if issue.AssignedTo != nil && *issue.AssignedTo != currentUserID && *issue.AssignedTo != issue.CreatedBy {
				if err := h.notificationService.CreateNotification(*issue.AssignedTo, models.NotificationTypeStatus, title, message, issueID); err != nil {
					log.Printf("Failed to notify issue assignee about status change: %v", err)
				}
			}

			// Notify all admins and team leads about status change ONLY if the updater is a regular user
			// If admin/team lead makes the change, only notify people involved (not other admins/team leads)
			if currentUser != nil && currentUser.Role == models.RoleUser {
				allUsers, err := h.userRepo.GetAll()
				if err == nil {
					for _, user := range allUsers {
						// Notify admins and team leads, but not the updater
						if (user.Role == models.RoleAdmin || user.Role == models.RoleTeamLead) && user.ID != currentUserID {
							if err := h.notificationService.CreateNotification(user.ID, models.NotificationTypeStatus, title, message, issueID); err != nil {
								log.Printf("Failed to notify admin/team lead %s about status change: %v", user.ID, err)
							}
						}
					}
				}
			}
		}()
	}

	c.JSON(http.StatusOK, issue.ToResponse())
}

func (h *IssueHandler) DeleteIssue(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid issue ID"})
		return
	}

	if err := h.issueService.DeleteIssue(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Issue deleted successfully"})
}
