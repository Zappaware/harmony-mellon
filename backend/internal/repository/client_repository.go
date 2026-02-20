package repository

import (
	"mellon-harmony-api/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ClientRepository interface {
	Create(client *models.Client) error
	GetByID(id uuid.UUID) (*models.Client, error)
	GetAll() ([]models.Client, error)
	Update(client *models.Client) error
	Delete(id uuid.UUID) error
}

type clientRepository struct {
	db *gorm.DB
}

func NewClientRepository(db *gorm.DB) ClientRepository {
	return &clientRepository{db: db}
}

func (r *clientRepository) Create(client *models.Client) error {
	return r.db.Create(client).Error
}

func (r *clientRepository) GetByID(id uuid.UUID) (*models.Client, error) {
	var client models.Client
	err := r.db.Preload("Creator").Preload("Projects").
		Where("id = ?", id).First(&client).Error
	if err != nil {
		return nil, err
	}
	return &client, nil
}

func (r *clientRepository) GetAll() ([]models.Client, error) {
	var clients []models.Client
	err := r.db.Preload("Creator").Preload("Projects").
		Order("created_at DESC").Find(&clients).Error
	return clients, err
}

func (r *clientRepository) Update(client *models.Client) error {
	return r.db.Save(client).Error
}

func (r *clientRepository) Delete(id uuid.UUID) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		var projectIDs []uuid.UUID
		if err := tx.Model(&models.Project{}).Where("client_id = ?", id).Pluck("id", &projectIDs).Error; err != nil {
			return err
		}
		for _, projectID := range projectIDs {
			var issueIDs []uuid.UUID
			if err := tx.Model(&models.Issue{}).Where("project_id = ?", projectID).Pluck("id", &issueIDs).Error; err != nil {
				return err
			}
			if len(issueIDs) > 0 {
				if err := tx.Where("issue_id IN ?", issueIDs).Delete(&models.Comment{}).Error; err != nil {
					return err
				}
			}
			if err := tx.Where("project_id = ?", projectID).Delete(&models.Issue{}).Error; err != nil {
				return err
			}
			if err := tx.Where("project_id = ?", projectID).Delete(&models.ProjectMember{}).Error; err != nil {
				return err
			}
			if err := tx.Delete(&models.Project{}, projectID).Error; err != nil {
				return err
			}
		}
		// Delete any issues linked only to this client (no project or project already removed)
		if err := tx.Where("client_id = ?", id).Delete(&models.Issue{}).Error; err != nil {
			return err
		}
		if err := tx.Where("client_id = ?", id).Delete(&models.ClientMember{}).Error; err != nil {
			return err
		}
		return tx.Delete(&models.Client{}, id).Error
	})
}
