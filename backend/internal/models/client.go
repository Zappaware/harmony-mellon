package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Client struct {
	ID              uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Name            string    `gorm:"not null" json:"name"`
	Description     string    `gorm:"type:text" json:"description,omitempty"`
	Email           *string   `gorm:"type:varchar(255)" json:"email,omitempty"`
	Phone           *string   `gorm:"type:varchar(50)" json:"phone,omitempty"`
	Address         *string   `gorm:"type:text" json:"address,omitempty"`
	ContactName     *string   `gorm:"type:varchar(255)" json:"contact_name,omitempty"`
	ContactEmail    *string   `gorm:"type:varchar(255)" json:"contact_email,omitempty"`
	ContactPhone    *string   `gorm:"type:varchar(50)" json:"contact_phone,omitempty"`
	CreatedBy       uuid.UUID `gorm:"type:uuid;not null" json:"created_by"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`

	// Relations
	Creator User      `gorm:"foreignKey:CreatedBy" json:"creator,omitempty"`
	Projects []Project `gorm:"foreignKey:ClientID" json:"projects,omitempty"`
}

func (c *Client) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}
