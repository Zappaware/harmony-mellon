package service

import (
	"fmt"
	"mellon-harmony-api/internal/models"
	"mellon-harmony-api/internal/repository"
	"strings"

	"github.com/google/uuid"
)

type CommentService interface {
	GetComments(issueID uuid.UUID) ([]models.Comment, error)
	CreateComment(issueID, userID uuid.UUID, text string, attachments []models.Attachment) (*models.Comment, error)
	UpdateComment(id uuid.UUID, text string) (*models.Comment, error)
	DeleteComment(id uuid.UUID) error
}

type commentService struct {
	commentRepo        repository.CommentRepository
	userRepo           repository.UserRepository
	issueRepo          repository.IssueRepository
	notificationService NotificationService
}

func NewCommentService(commentRepo repository.CommentRepository, userRepo repository.UserRepository, issueRepo repository.IssueRepository, notificationService NotificationService) CommentService {
	return &commentService{
		commentRepo:        commentRepo,
		userRepo:          userRepo,
		issueRepo:         issueRepo,
		notificationService: notificationService,
	}
}

func (s *commentService) GetComments(issueID uuid.UUID) ([]models.Comment, error) {
	return s.commentRepo.GetByIssueID(issueID)
}

func (s *commentService) CreateComment(issueID, userID uuid.UUID, text string, attachments []models.Attachment) (*models.Comment, error) {
	// Verify issue exists and load creator/assignee for notifications
	issue, err := s.issueRepo.GetByID(issueID)
	if err != nil {
		return nil, err
	}

	comment := &models.Comment{
		IssueID: issueID,
		UserID:  userID,
		Text:    text,
	}

	// Set attachments if provided
	if len(attachments) > 0 {
		if err := comment.SetAttachments(attachments); err != nil {
			return nil, err
		}
	}

	if err := s.commentRepo.Create(comment); err != nil {
		return nil, err
	}

	created, err := s.commentRepo.GetByID(comment.ID)
	if err != nil {
		return created, err
	}

	// Notify issue creator and assignee (excluding the comment author)
	author, _ := s.userRepo.GetByID(userID)
	authorName := "Someone"
	if author != nil && author.Name != "" {
		authorName = author.Name
	}
	title, message := s.commentNotificationContent(issue.Title, authorName, text, created.GetAttachments())
	relatedID := &issueID
	for _, targetID := range []uuid.UUID{issue.CreatedBy} {
		if targetID != userID {
			_ = s.notificationService.CreateNotification(targetID, models.NotificationTypeComment, title, message, relatedID)
		}
	}
	if issue.AssignedTo != nil && *issue.AssignedTo != userID && *issue.AssignedTo != issue.CreatedBy {
		_ = s.notificationService.CreateNotification(*issue.AssignedTo, models.NotificationTypeComment, title, message, relatedID)
	}

	return created, nil
}

// commentNotificationContent builds title and message for comment notifications (text, image, or file).
func (s *commentService) commentNotificationContent(issueTitle, authorName, text string, attachments []models.Attachment) (title, message string) {
	hasImage := false
	hasFile := false
	for _, a := range attachments {
		switch a.Type {
		case "image":
			hasImage = true
		case "file", "link":
			hasFile = true
		}
	}
	title = fmt.Sprintf("New comment on \"%s\"", issueTitle)
	if hasImage && hasFile {
		message = fmt.Sprintf("%s added a comment with an image and file.", authorName)
	} else if hasImage {
		message = fmt.Sprintf("%s added a comment with an image.", authorName)
	} else if hasFile {
		message = fmt.Sprintf("%s added a comment with a file.", authorName)
	} else {
		message = fmt.Sprintf("%s commented.", authorName)
	}
	if text != "" {
		preview := strings.TrimSpace(text)
		if len(preview) > 120 {
			preview = preview[:117] + "..."
		}
		message += " " + preview
	}
	return title, message
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
