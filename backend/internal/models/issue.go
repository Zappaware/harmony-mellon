package models

import (
	"encoding/json"
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

type Attachment struct {
	Type string `json:"type"` // "link", "image", "file"
	URL  string `json:"url"`
	Name string `json:"name,omitempty"`
}

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
	Attachments string       `gorm:"type:text" json:"-"` // JSON string stored in DB
	CreatedAt   time.Time    `json:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	// Relations
	Assignee   *User     `gorm:"foreignKey:AssignedTo" json:"assignee,omitempty"`
	Creator    User      `gorm:"foreignKey:CreatedBy" json:"creator"`
	Project    *Project  `gorm:"foreignKey:ProjectID" json:"project,omitempty"`
	Comments   []Comment `gorm:"foreignKey:IssueID" json:"comments,omitempty"`
}

// GetAttachments returns parsed attachments from JSON string
func (i *Issue) GetAttachments() []Attachment {
	if i.Attachments == "" {
		return []Attachment{}
	}
	var atts []Attachment
	if err := json.Unmarshal([]byte(i.Attachments), &atts); err != nil {
		return []Attachment{}
	}
	return atts
}

// SetAttachments stores attachments as JSON string
func (i *Issue) SetAttachments(atts []Attachment) {
	if len(atts) == 0 {
		i.Attachments = ""
		return
	}
	data, err := json.Marshal(atts)
	if err != nil {
		i.Attachments = ""
		return
	}
	i.Attachments = string(data)
}

func (i *Issue) BeforeCreate(tx *gorm.DB) error {
	if i.ID == uuid.Nil {
		i.ID = uuid.New()
	}
	return nil
}

// IssueResponse is used for JSON serialization with parsed attachments
type IssueResponse struct {
	ID          uuid.UUID    `json:"id"`
	Title       string       `json:"title"`
	Description string       `json:"description"`
	Status      IssueStatus  `json:"status"`
	Priority    IssuePriority `json:"priority"`
	AssignedTo  *uuid.UUID   `json:"assigned_to,omitempty"`
	CreatedBy   uuid.UUID    `json:"created_by"`
	ProjectID   *uuid.UUID   `json:"project_id,omitempty"`
	StartDate   *time.Time   `json:"start_date,omitempty"`
	DueDate     *time.Time   `json:"due_date,omitempty"`
	Attachments []Attachment `json:"attachments,omitempty"`
	CreatedAt   time.Time    `json:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at"`
	Assignee   *User         `json:"assignee,omitempty"`
	Creator    User         `json:"creator"`
	Project     *Project     `json:"project,omitempty"`
	Comments    []Comment    `json:"comments,omitempty"`
}

// ToResponse converts Issue to IssueResponse with parsed attachments
func (i *Issue) ToResponse() IssueResponse {
	return IssueResponse{
		ID:          i.ID,
		Title:       i.Title,
		Description: i.Description,
		Status:      i.Status,
		Priority:    i.Priority,
		AssignedTo:  i.AssignedTo,
		CreatedBy:   i.CreatedBy,
		ProjectID:   i.ProjectID,
		StartDate:   i.StartDate,
		DueDate:     i.DueDate,
		Attachments: i.GetAttachments(),
		CreatedAt:   i.CreatedAt,
		UpdatedAt:   i.UpdatedAt,
		Assignee:    i.Assignee,
		Creator:     i.Creator,
		Project:     i.Project,
		Comments:    i.Comments,
	}
}
