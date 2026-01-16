package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Comment struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	IssueID   uuid.UUID `gorm:"type:uuid;not null" json:"issue_id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	Text      string    `gorm:"type:text;not null" json:"text"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// Relations
	Issue Issue `gorm:"foreignKey:IssueID" json:"-"`
	User  User  `gorm:"foreignKey:UserID" json:"user"`
}

func (c *Comment) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}
