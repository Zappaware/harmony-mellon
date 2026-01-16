package repository

import (
	"mellon-harmony-api/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ProjectRepository interface {
	Create(project *models.Project) error
	GetByID(id uuid.UUID) (*models.Project, error)
	GetAll() ([]models.Project, error)
	Update(project *models.Project) error
	Delete(id uuid.UUID) error
	AddMember(projectID, userID uuid.UUID, role string) error
	RemoveMember(projectID, userID uuid.UUID) error
	GetMembers(projectID uuid.UUID) ([]models.ProjectMember, error)
}

type projectRepository struct {
	db *gorm.DB
}

func NewProjectRepository(db *gorm.DB) ProjectRepository {
	return &projectRepository{db: db}
}

func (r *projectRepository) Create(project *models.Project) error {
	return r.db.Create(project).Error
}

func (r *projectRepository) GetByID(id uuid.UUID) (*models.Project, error) {
	var project models.Project
	err := r.db.Preload("Creator").Preload("Members.User").Preload("Issues").
		Where("id = ?", id).First(&project).Error
	if err != nil {
		return nil, err
	}
	return &project, nil
}

func (r *projectRepository) GetAll() ([]models.Project, error) {
	var projects []models.Project
	err := r.db.Preload("Creator").Preload("Members.User").
		Order("created_at DESC").Find(&projects).Error
	return projects, err
}

func (r *projectRepository) Update(project *models.Project) error {
	return r.db.Save(project).Error
}

func (r *projectRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Project{}, id).Error
}

func (r *projectRepository) AddMember(projectID, userID uuid.UUID, role string) error {
	member := &models.ProjectMember{
		ProjectID: projectID,
		UserID:    userID,
		Role:      role,
	}
	return r.db.Create(member).Error
}

func (r *projectRepository) RemoveMember(projectID, userID uuid.UUID) error {
	return r.db.Where("project_id = ? AND user_id = ?", projectID, userID).
		Delete(&models.ProjectMember{}).Error
}

func (r *projectRepository) GetMembers(projectID uuid.UUID) ([]models.ProjectMember, error) {
	var members []models.ProjectMember
	err := r.db.Preload("User").Where("project_id = ?", projectID).Find(&members).Error
	return members, err
}
