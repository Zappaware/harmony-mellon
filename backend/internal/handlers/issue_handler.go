package handlers

import (
	"mellon-harmony-api/internal/models"
	"mellon-harmony-api/internal/service"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type IssueHandler struct {
	issueService service.IssueService
}

func NewIssueHandler(issueService service.IssueService) *IssueHandler {
	return &IssueHandler{issueService: issueService}
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

	c.JSON(http.StatusOK, issues)
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

	c.JSON(http.StatusOK, issue)
}

type CreateIssueRequest struct {
	Title       string                `json:"title" binding:"required"`
	Description string                `json:"description" binding:"required"`
	Priority    models.IssuePriority  `json:"priority"`
	AssignedTo  *string               `json:"assigned_to"`
	ProjectID   *string               `json:"project_id"`
	StartDate   *string               `json:"start_date"`
	DueDate     *string               `json:"due_date"`
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

	c.JSON(http.StatusCreated, issue)
}

type UpdateIssueRequest struct {
	Title       *string               `json:"title"`
	Description *string               `json:"description"`
	Priority    *models.IssuePriority  `json:"priority"`
	AssignedTo  *string               `json:"assigned_to"`
	ProjectID   *string               `json:"project_id"`
	StartDate   *string               `json:"start_date"`
	DueDate     *string               `json:"due_date"`
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

	issue, err := h.issueService.UpdateIssue(id, updates)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, issue)
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

	issue, err := h.issueService.UpdateIssueStatus(id, req.Status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, issue)
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
