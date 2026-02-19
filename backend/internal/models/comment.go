package models

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Comment struct {
	ID         uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	IssueID    uuid.UUID `gorm:"type:uuid;not null" json:"issue_id"`
	UserID     uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	Text       string    `gorm:"type:text;not null" json:"text"`
	Attachments string   `gorm:"type:text" json:"-"` // JSON string stored in DB
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`

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

// GetAttachments returns parsed attachments from JSON string
func (c *Comment) GetAttachments() []Attachment {
	if c.Attachments == "" {
		return []Attachment{}
	}
	var attachments []Attachment
	if err := json.Unmarshal([]byte(c.Attachments), &attachments); err != nil {
		return []Attachment{}
	}
	return attachments
}

// SetAttachments stores attachments as JSON string
func (c *Comment) SetAttachments(attachments []Attachment) error {
	if len(attachments) == 0 {
		c.Attachments = ""
		return nil
	}
	data, err := json.Marshal(attachments)
	if err != nil {
		return err
	}
	c.Attachments = string(data)
	return nil
}

// CommentResponse is used for JSON serialization with parsed attachments
type CommentResponse struct {
	ID         uuid.UUID   `json:"id"`
	IssueID    uuid.UUID   `json:"issue_id"`
	UserID     uuid.UUID   `json:"user_id"`
	Text       string      `json:"text"`
	Attachments []Attachment `json:"attachments,omitempty"`
	CreatedAt  time.Time   `json:"created_at"`
	UpdatedAt  time.Time   `json:"updated_at"`
	User       *User       `json:"user,omitempty"`
}

// ToResponse converts Comment to CommentResponse with parsed attachments
func (c *Comment) ToResponse() CommentResponse {
	return CommentResponse{
		ID:          c.ID,
		IssueID:     c.IssueID,
		UserID:      c.UserID,
		Text:        c.Text,
		Attachments: c.GetAttachments(),
		CreatedAt:   c.CreatedAt,
		UpdatedAt:   c.UpdatedAt,
		User:        &c.User,
	}
}
