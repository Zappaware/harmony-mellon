package service

import (
	"mellon-harmony-api/internal/models"
	"mellon-harmony-api/internal/repository"

	"github.com/google/uuid"
)

type ClientService interface {
	GetClient(id uuid.UUID) (*models.Client, error)
	GetAllClients() ([]models.Client, error)
	CreateClient(client *models.Client) error
	UpdateClient(id uuid.UUID, updates map[string]interface{}) (*models.Client, error)
	DeleteClient(id uuid.UUID) error
}

type clientService struct {
	clientRepo repository.ClientRepository
	userRepo   repository.UserRepository
}

func NewClientService(clientRepo repository.ClientRepository, userRepo repository.UserRepository) ClientService {
	return &clientService{
		clientRepo: clientRepo,
		userRepo:   userRepo,
	}
}

func (s *clientService) GetClient(id uuid.UUID) (*models.Client, error) {
	return s.clientRepo.GetByID(id)
}

func (s *clientService) GetAllClients() ([]models.Client, error) {
	return s.clientRepo.GetAll()
}

func (s *clientService) CreateClient(client *models.Client) error {
	return s.clientRepo.Create(client)
}

func (s *clientService) UpdateClient(id uuid.UUID, updates map[string]interface{}) (*models.Client, error) {
	client, err := s.clientRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	if name, ok := updates["name"].(string); ok {
		client.Name = name
	}
	if description, ok := updates["description"].(string); ok {
		client.Description = description
	}
	if email, ok := updates["email"].(*string); ok {
		client.Email = email
	}
	if phone, ok := updates["phone"].(*string); ok {
		client.Phone = phone
	}
	if address, ok := updates["address"].(*string); ok {
		client.Address = address
	}
	if contactName, ok := updates["contact_name"].(*string); ok {
		client.ContactName = contactName
	}
	if contactEmail, ok := updates["contact_email"].(*string); ok {
		client.ContactEmail = contactEmail
	}
	if contactPhone, ok := updates["contact_phone"].(*string); ok {
		client.ContactPhone = contactPhone
	}

	if err := s.clientRepo.Update(client); err != nil {
		return nil, err
	}

	return s.clientRepo.GetByID(id)
}

func (s *clientService) DeleteClient(id uuid.UUID) error {
	return s.clientRepo.Delete(id)
}
