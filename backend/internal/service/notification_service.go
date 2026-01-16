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
	emailService     EmailService
	userRepo         repository.UserRepository
}

func NewNotificationService(notificationRepo repository.NotificationRepository) NotificationService {
	return &notificationService{
		notificationRepo: notificationRepo,
	}
}

func NewNotificationServiceWithEmail(notificationRepo repository.NotificationRepository, emailService EmailService, userRepo repository.UserRepository) NotificationService {
	return &notificationService{
		notificationRepo: notificationRepo,
		emailService:     emailService,
		userRepo:         userRepo,
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
	
	err := s.notificationRepo.Create(notification)
	if err != nil {
		return err
	}

	// Send email notification (non-blocking)
	if s.emailService != nil && s.userRepo != nil {
		go func() {
			user, err := s.userRepo.GetByID(userID)
			if err == nil && user != nil {
				if err := s.emailService.SendNotificationEmail(user.Email, title, message, notification.ID.String()); err != nil {
					// Log error but don't fail notification creation
					// log.Printf("Failed to send notification email to %s: %v", user.Email, err)
				}
			}
		}()
	}

	return nil
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
