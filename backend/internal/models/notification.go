package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type NotificationType string

const (
	NotificationTypeComment    NotificationType = "comment"
	NotificationTypeAssignment NotificationType = "assignment"
	NotificationTypeComplete   NotificationType = "complete"
	NotificationTypeUser       NotificationType = "user"
	NotificationTypeStatus     NotificationType = "status"
)

type Notification struct {
	ID        uuid.UUID       `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID    uuid.UUID       `gorm:"type:uuid;not null;index" json:"user_id"`
	Type      NotificationType `gorm:"type:varchar(50);not null" json:"type"`
	Title     string          `gorm:"not null" json:"title"`
	Message   string          `gorm:"type:text;not null" json:"message"`
	Read      bool            `gorm:"default:false" json:"read"`
	RelatedID *uuid.UUID      `gorm:"type:uuid" json:"related_id,omitempty"` // ID of related issue, comment, etc.
	CreatedAt time.Time       `json:"created_at"`
	UpdatedAt time.Time       `json:"updated_at"`
	DeletedAt gorm.DeletedAt  `gorm:"index" json:"-"`

	// Relations
	User User `gorm:"foreignKey:UserID" json:"-"`
}

func (n *Notification) BeforeCreate(tx *gorm.DB) error {
	if n.ID == uuid.Nil {
		n.ID = uuid.New()
	}
	return nil
}
