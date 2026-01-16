package service

import (
	"mellon-harmony-api/internal/models"
	"mellon-harmony-api/internal/repository"

	"github.com/google/uuid"
)

type CommentService interface {
	GetComments(issueID uuid.UUID) ([]models.Comment, error)
	CreateComment(issueID, userID uuid.UUID, text string) (*models.Comment, error)
	UpdateComment(id uuid.UUID, text string) (*models.Comment, error)
	DeleteComment(id uuid.UUID) error
}

type commentService struct {
	commentRepo repository.CommentRepository
	userRepo    repository.UserRepository
	issueRepo   repository.IssueRepository
}

func NewCommentService(commentRepo repository.CommentRepository, userRepo repository.UserRepository, issueRepo repository.IssueRepository) CommentService {
	return &commentService{
		commentRepo: commentRepo,
		userRepo:    userRepo,
		issueRepo:   issueRepo,
	}
}

func (s *commentService) GetComments(issueID uuid.UUID) ([]models.Comment, error) {
	return s.commentRepo.GetByIssueID(issueID)
}

func (s *commentService) CreateComment(issueID, userID uuid.UUID, text string) (*models.Comment, error) {
	// Verify issue exists
	_, err := s.issueRepo.GetByID(issueID)
	if err != nil {
		return nil, err
	}

	comment := &models.Comment{
		IssueID: issueID,
		UserID:  userID,
		Text:    text,
	}

	if err := s.commentRepo.Create(comment); err != nil {
		return nil, err
	}

	return s.commentRepo.GetByID(comment.ID)
}

func (s *commentService) UpdateComment(id uuid.UUID, text string) (*models.Comment, error) {
	comment, err := s.commentRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	comment.Text = text
	if err := s.commentRepo.Update(comment); err != nil {
		return nil, err
	}

	return s.commentRepo.GetByID(id)
}

func (s *commentService) DeleteComment(id uuid.UUID) error {
	return s.commentRepo.Delete(id)
}
