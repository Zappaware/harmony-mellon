package service

import (
	"mellon-harmony-api/internal/models"
	"mellon-harmony-api/internal/repository"

	"github.com/google/uuid"
)

type ProjectService interface {
	GetProject(id uuid.UUID) (*models.Project, error)
	GetAllProjects() ([]models.Project, error)
	CreateProject(project *models.Project) error
	UpdateProject(id uuid.UUID, updates map[string]interface{}) (*models.Project, error)
	DeleteProject(id uuid.UUID) error
	AddMember(projectID, userID uuid.UUID, role string) error
	RemoveMember(projectID, userID uuid.UUID) error
}

type projectService struct {
	projectRepo repository.ProjectRepository
	userRepo    repository.UserRepository
}

func NewProjectService(projectRepo repository.ProjectRepository, userRepo repository.UserRepository) ProjectService {
	return &projectService{
		projectRepo: projectRepo,
		userRepo:    userRepo,
	}
}

func (s *projectService) GetProject(id uuid.UUID) (*models.Project, error) {
	return s.projectRepo.GetByID(id)
}

func (s *projectService) GetAllProjects() ([]models.Project, error) {
	return s.projectRepo.GetAll()
}

func (s *projectService) CreateProject(project *models.Project) error {
	return s.projectRepo.Create(project)
}

func (s *projectService) UpdateProject(id uuid.UUID, updates map[string]interface{}) (*models.Project, error) {
	project, err := s.projectRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	if name, ok := updates["name"].(string); ok {
		project.Name = name
	}
	if description, ok := updates["description"].(string); ok {
		project.Description = description
	}
	if projectType, ok := updates["type"].(models.ProjectType); ok {
		project.Type = projectType
	}
	if progress, ok := updates["progress"].(int); ok {
		project.Progress = progress
	}
	if status, ok := updates["status"].(models.ProjectStatus); ok {
		project.Status = status
	}
	if color, ok := updates["color"].(string); ok {
		project.Color = color
	}

	if err := s.projectRepo.Update(project); err != nil {
		return nil, err
	}

	return s.projectRepo.GetByID(id)
}

func (s *projectService) DeleteProject(id uuid.UUID) error {
	return s.projectRepo.Delete(id)
}

func (s *projectService) AddMember(projectID, userID uuid.UUID, role string) error {
	// Verify user exists
	_, err := s.userRepo.GetByID(userID)
	if err != nil {
		return err
	}

	return s.projectRepo.AddMember(projectID, userID, role)
}

func (s *projectService) RemoveMember(projectID, userID uuid.UUID) error {
	return s.projectRepo.RemoveMember(projectID, userID)
}
