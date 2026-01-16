package repository

import (
	"mellon-harmony-api/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type NotificationRepository interface {
	Create(notification *models.Notification) error
	GetByUserID(userID uuid.UUID) ([]models.Notification, error)
	GetUnreadByUserID(userID uuid.UUID) ([]models.Notification, error)
	GetByID(id uuid.UUID) (*models.Notification, error)
	MarkAsRead(id uuid.UUID) error
	MarkAllAsRead(userID uuid.UUID) error
	Delete(id uuid.UUID) error
}

type notificationRepository struct {
	db *gorm.DB
}

func NewNotificationRepository(db *gorm.DB) NotificationRepository {
	return &notificationRepository{db: db}
}

func (r *notificationRepository) Create(notification *models.Notification) error {
	return r.db.Create(notification).Error
}

func (r *notificationRepository) GetByUserID(userID uuid.UUID) ([]models.Notification, error) {
	var notifications []models.Notification
	err := r.db.Where("user_id = ?", userID).
		Order("created_at DESC").
		Find(&notifications).Error
	return notifications, err
}

func (r *notificationRepository) GetUnreadByUserID(userID uuid.UUID) ([]models.Notification, error) {
	var notifications []models.Notification
	err := r.db.Where("user_id = ? AND read = ?", userID, false).
		Order("created_at DESC").
		Find(&notifications).Error
	return notifications, err
}

func (r *notificationRepository) GetByID(id uuid.UUID) (*models.Notification, error) {
	var notification models.Notification
	err := r.db.Where("id = ?", id).First(&notification).Error
	if err != nil {
		return nil, err
	}
	return &notification, nil
}

func (r *notificationRepository) MarkAsRead(id uuid.UUID) error {
	return r.db.Model(&models.Notification{}).
		Where("id = ?", id).
		Update("read", true).Error
}

func (r *notificationRepository) MarkAllAsRead(userID uuid.UUID) error {
	return r.db.Model(&models.Notification{}).
		Where("user_id = ? AND read = ?", userID, false).
		Update("read", true).Error
}

func (r *notificationRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Notification{}, "id = ?", id).Error
}
