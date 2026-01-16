package service

import (
	"mellon-harmony-api/internal/models"
	"mellon-harmony-api/internal/repository"

	"github.com/google/uuid"
)

type NotificationService interface {
	CreateNotification(userID uuid.UUID, notificationType models.NotificationType, title, message string, relatedID *uuid.UUID) error
	GetUserNotifications(userID uuid.UUID) ([]models.Notification, error)
	GetUnreadNotifications(userID uuid.UUID) ([]models.Notification, error)
	MarkAsRead(notificationID uuid.UUID) error
	MarkAllAsRead(userID uuid.UUID) error
	DeleteNotification(notificationID uuid.UUID) error
}

type notificationService struct {
	notificationRepo repository.NotificationRepository
}

func NewNotificationService(notificationRepo repository.NotificationRepository) NotificationService {
	return &notificationService{
		notificationRepo: notificationRepo,
	}
}

func (s *notificationService) CreateNotification(userID uuid.UUID, notificationType models.NotificationType, title, message string, relatedID *uuid.UUID) error {
	notification := &models.Notification{
		UserID:    userID,
		Type:      notificationType,
		Title:     title,
		Message:   message,
		Read:      false,
		RelatedID: relatedID,
	}
	return s.notificationRepo.Create(notification)
}

func (s *notificationService) GetUserNotifications(userID uuid.UUID) ([]models.Notification, error) {
	return s.notificationRepo.GetByUserID(userID)
}

func (s *notificationService) GetUnreadNotifications(userID uuid.UUID) ([]models.Notification, error) {
	return s.notificationRepo.GetUnreadByUserID(userID)
}

func (s *notificationService) MarkAsRead(notificationID uuid.UUID) error {
	return s.notificationRepo.MarkAsRead(notificationID)
}

func (s *notificationService) MarkAllAsRead(userID uuid.UUID) error {
	return s.notificationRepo.MarkAllAsRead(userID)
}

func (s *notificationService) DeleteNotification(notificationID uuid.UUID) error {
	return s.notificationRepo.Delete(notificationID)
}
