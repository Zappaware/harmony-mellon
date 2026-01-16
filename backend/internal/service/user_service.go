package service

import (
	"mellon-harmony-api/internal/models"
	"mellon-harmony-api/internal/repository"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type UserService interface {
	GetUser(id uuid.UUID) (*models.User, error)
	GetAllUsers() ([]models.User, error)
	UpdateUser(id uuid.UUID, name, email *string, role *models.UserRole) (*models.User, error)
	DeleteUser(id uuid.UUID) error
}

type userService struct {
	userRepo repository.UserRepository
}

func NewUserService(userRepo repository.UserRepository) UserService {
	return &userService{userRepo: userRepo}
}

func (s *userService) GetUser(id uuid.UUID) (*models.User, error) {
	user, err := s.userRepo.GetByID(id)
	if err != nil {
		return nil, err
	}
	user.Password = ""
	return user, nil
}

func (s *userService) GetAllUsers() ([]models.User, error) {
	users, err := s.userRepo.GetAll()
	if err != nil {
		return nil, err
	}
	// Clear passwords
	for i := range users {
		users[i].Password = ""
	}
	return users, nil
}

func (s *userService) UpdateUser(id uuid.UUID, name, email *string, role *models.UserRole) (*models.User, error) {
	user, err := s.userRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	if name != nil {
		user.Name = *name
	}
	if email != nil {
		user.Email = *email
	}
	if role != nil {
		user.Role = *role
	}

	if err := s.userRepo.Update(user); err != nil {
		return nil, err
	}

	user.Password = ""
	return user, nil
}

func (s *userService) DeleteUser(id uuid.UUID) error {
	return s.userRepo.Delete(id)
}

func (s *userService) UpdatePassword(id uuid.UUID, newPassword string) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	user, err := s.userRepo.GetByID(id)
	if err != nil {
		return err
	}

	user.Password = string(hashedPassword)
	return s.userRepo.Update(user)
}
