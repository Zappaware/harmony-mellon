package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type IssueStatus string

const (
	StatusTodo       IssueStatus = "todo"
	StatusInProgress IssueStatus = "in-progress"
	StatusReview     IssueStatus = "review"
	StatusDone       IssueStatus = "done"
)

type IssuePriority string

const (
	PriorityLow    IssuePriority = "low"
	PriorityMedium IssuePriority = "medium"
	PriorityHigh   IssuePriority = "high"
)

type Issue struct {
	ID          uuid.UUID    `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Title       string       `gorm:"not null" json:"title"`
	Description string       `gorm:"type:text;not null" json:"description"`
	Status      IssueStatus  `gorm:"type:varchar(20);default:'todo'" json:"status"`
	Priority    IssuePriority `gorm:"type:varchar(20);default:'medium'" json:"priority"`
	AssignedTo  *uuid.UUID   `gorm:"type:uuid" json:"assigned_to,omitempty"`
	CreatedBy   uuid.UUID    `gorm:"type:uuid;not null" json:"created_by"`
	ProjectID   *uuid.UUID   `gorm:"type:uuid" json:"project_id,omitempty"`
	StartDate   *time.Time   `json:"start_date,omitempty"`
	DueDate     *time.Time   `json:"due_date,omitempty"`
	CreatedAt   time.Time    `json:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	// Relations
	Assignee   *User     `gorm:"foreignKey:AssignedTo" json:"assignee,omitempty"`
	Creator    User      `gorm:"foreignKey:CreatedBy" json:"creator"`
	Project    *Project  `gorm:"foreignKey:ProjectID" json:"project,omitempty"`
	Comments   []Comment `gorm:"foreignKey:IssueID" json:"comments,omitempty"`
}

func (i *Issue) BeforeCreate(tx *gorm.DB) error {
	if i.ID == uuid.Nil {
		i.ID = uuid.New()
	}
	return nil
}
