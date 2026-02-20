package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ClientMember links a user to a client (team per client).
type ClientMember struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	ClientID  uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_client_member" json:"client_id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_client_member" json:"user_id"`
	CreatedAt time.Time `json:"created_at"`

	// Relations
	Client Client `gorm:"foreignKey:ClientID" json:"-"`
	User   User   `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

func (cm *ClientMember) BeforeCreate(tx *gorm.DB) error {
	if cm.ID == uuid.Nil {
		cm.ID = uuid.New()
	}
	return nil
}
