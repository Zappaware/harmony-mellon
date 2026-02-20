package repository

import (
	"mellon-harmony-api/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ClientMemberRepository interface {
	Add(clientID, userID uuid.UUID) error
	Remove(clientID, userID uuid.UUID) error
	GetByClientID(clientID uuid.UUID) ([]models.ClientMember, error)
	GetClientIDsForUser(userID uuid.UUID) ([]uuid.UUID, error)
	Exists(clientID, userID uuid.UUID) (bool, error)
}

type clientMemberRepository struct {
	db *gorm.DB
}

func NewClientMemberRepository(db *gorm.DB) ClientMemberRepository {
	return &clientMemberRepository{db: db}
}

func (r *clientMemberRepository) Add(clientID, userID uuid.UUID) error {
	m := &models.ClientMember{ClientID: clientID, UserID: userID}
	return r.db.Create(m).Error
}

func (r *clientMemberRepository) Remove(clientID, userID uuid.UUID) error {
	return r.db.Where("client_id = ? AND user_id = ?", clientID, userID).
		Delete(&models.ClientMember{}).Error
}

func (r *clientMemberRepository) GetByClientID(clientID uuid.UUID) ([]models.ClientMember, error) {
	var members []models.ClientMember
	err := r.db.Preload("User").Where("client_id = ?", clientID).Find(&members).Error
	return members, err
}

func (r *clientMemberRepository) GetClientIDsForUser(userID uuid.UUID) ([]uuid.UUID, error) {
	var ids []uuid.UUID
	err := r.db.Model(&models.ClientMember{}).Where("user_id = ?", userID).Pluck("client_id", &ids).Error
	return ids, err
}

func (r *clientMemberRepository) Exists(clientID, userID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.Model(&models.ClientMember{}).Where("client_id = ? AND user_id = ?", clientID, userID).Count(&count).Error
	return count > 0, err
}
