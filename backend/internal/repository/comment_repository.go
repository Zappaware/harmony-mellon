package repository

import (
	"mellon-harmony-api/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CommentRepository interface {
	Create(comment *models.Comment) error
	GetByID(id uuid.UUID) (*models.Comment, error)
	GetByIssueID(issueID uuid.UUID) ([]models.Comment, error)
	Update(comment *models.Comment) error
	Delete(id uuid.UUID) error
}

type commentRepository struct {
	db *gorm.DB
}

func NewCommentRepository(db *gorm.DB) CommentRepository {
	return &commentRepository{db: db}
}

func (r *commentRepository) Create(comment *models.Comment) error {
	return r.db.Create(comment).Error
}

func (r *commentRepository) GetByID(id uuid.UUID) (*models.Comment, error) {
	var comment models.Comment
	err := r.db.Preload("User").Where("id = ?", id).First(&comment).Error
	if err != nil {
		return nil, err
	}
	return &comment, nil
}

func (r *commentRepository) GetByIssueID(issueID uuid.UUID) ([]models.Comment, error) {
	var comments []models.Comment
	err := r.db.Preload("User").Where("issue_id = ?", issueID).
		Order("created_at ASC").Find(&comments).Error
	return comments, err
}

func (r *commentRepository) Update(comment *models.Comment) error {
	return r.db.Save(comment).Error
}

func (r *commentRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Comment{}, id).Error
}
