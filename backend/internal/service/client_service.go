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
	GetClientMembers(clientID uuid.UUID) ([]models.ClientMember, error)
	AddClientMember(clientID, userID uuid.UUID) error
	RemoveClientMember(clientID, userID uuid.UUID) error
}

type clientService struct {
	clientRepo     repository.ClientRepository
	userRepo       repository.UserRepository
	clientMemberRepo repository.ClientMemberRepository
}

func NewClientService(clientRepo repository.ClientRepository, userRepo repository.UserRepository, clientMemberRepo repository.ClientMemberRepository) ClientService {
	return &clientService{
		clientRepo:       clientRepo,
		userRepo:         userRepo,
		clientMemberRepo: clientMemberRepo,
	}
}

func (s *clientService) GetClient(id uuid.UUID) (*models.Client, error) {
	client, err := s.clientRepo.GetByID(id)
	if err != nil {
		return nil, err
	}
	members, _ := s.clientMemberRepo.GetByClientID(id)
	client.ClientMembers = members
	return client, nil
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
	if logo, ok := updates["logo"].(*string); ok {
		client.Logo = logo
	}

	if err := s.clientRepo.Update(client); err != nil {
		return nil, err
	}

	return s.clientRepo.GetByID(id)
}

func (s *clientService) DeleteClient(id uuid.UUID) error {
	return s.clientRepo.Delete(id)
}

func (s *clientService) GetClientMembers(clientID uuid.UUID) ([]models.ClientMember, error) {
	return s.clientMemberRepo.GetByClientID(clientID)
}

func (s *clientService) AddClientMember(clientID, userID uuid.UUID) error {
	_, err := s.clientRepo.GetByID(clientID)
	if err != nil {
		return err
	}
	_, err = s.userRepo.GetByID(userID)
	if err != nil {
		return err
	}
	exists, _ := s.clientMemberRepo.Exists(clientID, userID)
	if exists {
		return nil // idempotent
	}
	return s.clientMemberRepo.Add(clientID, userID)
}

func (s *clientService) RemoveClientMember(clientID, userID uuid.UUID) error {
	return s.clientMemberRepo.Remove(clientID, userID)
}
