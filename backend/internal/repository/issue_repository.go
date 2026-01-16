package repository

import (
	"mellon-harmony-api/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type IssueRepository interface {
	Create(issue *models.Issue) error
	GetByID(id uuid.UUID) (*models.Issue, error)
	GetAll(filters map[string]interface{}) ([]models.Issue, error)
	GetByAssignedTo(userID uuid.UUID) ([]models.Issue, error)
	GetByProjectID(projectID uuid.UUID) ([]models.Issue, error)
	Update(issue *models.Issue) error
	Delete(id uuid.UUID) error
}

type issueRepository struct {
	db *gorm.DB
}

func NewIssueRepository(db *gorm.DB) IssueRepository {
	return &issueRepository{db: db}
}

func (r *issueRepository) Create(issue *models.Issue) error {
	return r.db.Create(issue).Error
}

func (r *issueRepository) GetByID(id uuid.UUID) (*models.Issue, error) {
	var issue models.Issue
	err := r.db.Preload("Assignee").Preload("Creator").Preload("Project").Preload("Comments.User").
		Where("id = ?", id).First(&issue).Error
	if err != nil {
		return nil, err
	}
	return &issue, nil
}

func (r *issueRepository) GetAll(filters map[string]interface{}) ([]models.Issue, error) {
	var issues []models.Issue
	query := r.db.Preload("Assignee").Preload("Creator").Preload("Project").Preload("Comments.User")

	if status, ok := filters["status"]; ok {
		query = query.Where("status = ?", status)
	}
	if priority, ok := filters["priority"]; ok {
		query = query.Where("priority = ?", priority)
	}
	if assignedTo, ok := filters["assigned_to"]; ok {
		query = query.Where("assigned_to = ?", assignedTo)
	}
	if projectID, ok := filters["project_id"]; ok {
		query = query.Where("project_id = ?", projectID)
	}

	err := query.Order("created_at DESC").Find(&issues).Error
	return issues, err
}

func (r *issueRepository) GetByAssignedTo(userID uuid.UUID) ([]models.Issue, error) {
	var issues []models.Issue
	err := r.db.Preload("Assignee").Preload("Creator").Preload("Project").Preload("Comments.User").
		Where("assigned_to = ?", userID).Order("created_at DESC").Find(&issues).Error
	return issues, err
}

func (r *issueRepository) GetByProjectID(projectID uuid.UUID) ([]models.Issue, error) {
	var issues []models.Issue
	err := r.db.Preload("Assignee").Preload("Creator").Preload("Comments.User").
		Where("project_id = ?", projectID).Order("created_at DESC").Find(&issues).Error
	return issues, err
}

func (r *issueRepository) Update(issue *models.Issue) error {
	return r.db.Save(issue).Error
}

func (r *issueRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Issue{}, id).Error
}
