package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ProjectStatus string

const (
	ProjectStatusPlanning    ProjectStatus = "planning"
	ProjectStatusInProgress  ProjectStatus = "En Progreso"
	ProjectStatusFinalizing  ProjectStatus = "Finalizando"
	ProjectStatusCompleted   ProjectStatus = "completed"
	ProjectStatusOnHold       ProjectStatus = "on_hold"
)

type Project struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Name        string    `gorm:"not null" json:"name"`
	Description string    `gorm:"type:text" json:"description"`
	Progress    int       `gorm:"default:0;check:progress >= 0 AND progress <= 100" json:"progress"`
	Status      ProjectStatus `gorm:"type:varchar(50);default:'planning'" json:"status"`
	Deadline    *time.Time `json:"deadline,omitempty"`
	Color       string    `gorm:"type:varchar(20)" json:"color"`
	CreatedBy   uuid.UUID `gorm:"type:uuid;not null" json:"created_by"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	// Relations
	Creator  User            `gorm:"foreignKey:CreatedBy" json:"creator"`
	Members  []ProjectMember `gorm:"foreignKey:ProjectID" json:"members,omitempty"`
	Issues   []Issue         `gorm:"foreignKey:ProjectID" json:"issues,omitempty"`
}

func (p *Project) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}

type ProjectMember struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	ProjectID uuid.UUID `gorm:"type:uuid;not null" json:"project_id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	Role      string    `gorm:"type:varchar(20);default:'member'" json:"role"`
	CreatedAt time.Time `json:"created_at"`

	// Relations
	Project Project `gorm:"foreignKey:ProjectID" json:"-"`
	User    User    `gorm:"foreignKey:UserID" json:"user"`
}

func (pm *ProjectMember) BeforeCreate(tx *gorm.DB) error {
	if pm.ID == uuid.Nil {
		pm.ID = uuid.New()
	}
	return nil
}
