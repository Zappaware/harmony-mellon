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
	return r.db.Delete(&models.Client{}, id).Error
}
