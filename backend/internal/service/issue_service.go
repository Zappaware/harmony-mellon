package service

import (
	"mellon-harmony-api/internal/models"
	"mellon-harmony-api/internal/repository"
	"time"

	"github.com/google/uuid"
)

type IssueService interface {
	GetIssue(id uuid.UUID) (*models.Issue, error)
	GetIssues(filters map[string]interface{}) ([]models.Issue, error)
	GetIssuesByAssignedTo(userID uuid.UUID) ([]models.Issue, error)
	CreateIssue(issue *models.Issue) error
	UpdateIssue(id uuid.UUID, updates map[string]interface{}) (*models.Issue, error)
	UpdateIssueStatus(id uuid.UUID, status models.IssueStatus) (*models.Issue, error)
	DeleteIssue(id uuid.UUID) error
}

type issueService struct {
	issueRepo repository.IssueRepository
	userRepo  repository.UserRepository
}

func NewIssueService(issueRepo repository.IssueRepository, userRepo repository.UserRepository) IssueService {
	return &issueService{
		issueRepo: issueRepo,
		userRepo:  userRepo,
	}
}

func (s *issueService) GetIssue(id uuid.UUID) (*models.Issue, error) {
	return s.issueRepo.GetByID(id)
}

func (s *issueService) GetIssues(filters map[string]interface{}) ([]models.Issue, error) {
	return s.issueRepo.GetAll(filters)
}

func (s *issueService) GetIssuesByAssignedTo(userID uuid.UUID) ([]models.Issue, error) {
	return s.issueRepo.GetByAssignedTo(userID)
}

func (s *issueService) CreateIssue(issue *models.Issue) error {
	return s.issueRepo.Create(issue)
}

func (s *issueService) UpdateIssue(id uuid.UUID, updates map[string]interface{}) (*models.Issue, error) {
	issue, err := s.issueRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	if title, ok := updates["title"].(string); ok {
		issue.Title = title
	}
	if description, ok := updates["description"].(string); ok {
		issue.Description = description
	}
	if priority, ok := updates["priority"].(models.IssuePriority); ok {
		issue.Priority = priority
	}
	if assignedTo, ok := updates["assigned_to"].(*uuid.UUID); ok {
		issue.AssignedTo = assignedTo
	}
	if projectID, ok := updates["project_id"].(*uuid.UUID); ok {
		issue.ProjectID = projectID
	}
	if startDate, ok := updates["start_date"].(*time.Time); ok {
		issue.StartDate = startDate
	}
	if dueDate, ok := updates["due_date"].(*time.Time); ok {
		issue.DueDate = dueDate
	}

	if err := s.issueRepo.Update(issue); err != nil {
		return nil, err
	}

	return s.issueRepo.GetByID(id)
}

func (s *issueService) UpdateIssueStatus(id uuid.UUID, status models.IssueStatus) (*models.Issue, error) {
	issue, err := s.issueRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	issue.Status = status
	if err := s.issueRepo.Update(issue); err != nil {
		return nil, err
	}

	return s.issueRepo.GetByID(id)
}

func (s *issueService) DeleteIssue(id uuid.UUID) error {
	return s.issueRepo.Delete(id)
}
