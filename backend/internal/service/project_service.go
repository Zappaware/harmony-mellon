package service

import (
	"fmt"
	"mellon-harmony-api/internal/models"
	"mellon-harmony-api/internal/repository"

	"github.com/google/uuid"
)

var monthNamesES = []string{"", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"}

type ProjectService interface {
	GetProject(id uuid.UUID) (*models.Project, error)
	GetAllProjects() ([]models.Project, error)
	GetProjectsForUser(userID uuid.UUID, role string) ([]models.Project, error)
	CreateProject(project *models.Project) error
	UpdateProject(id uuid.UUID, updates map[string]interface{}) (*models.Project, error)
	DeleteProject(id uuid.UUID) error
	AddMember(projectID, userID uuid.UUID, role string) error
	RemoveMember(projectID, userID uuid.UUID) error
	BulkCreateMonthlyProjects(month, year int, clientIDs []uuid.UUID, types []string, createdBy uuid.UUID, addClientMembers bool) ([]models.Project, error)
}

type projectService struct {
	projectRepo      repository.ProjectRepository
	userRepo         repository.UserRepository
	clientRepo       repository.ClientRepository
	clientMemberRepo repository.ClientMemberRepository
}

func NewProjectService(projectRepo repository.ProjectRepository, userRepo repository.UserRepository, clientMemberRepo repository.ClientMemberRepository, clientRepo repository.ClientRepository) ProjectService {
	return &projectService{
		projectRepo:      projectRepo,
		userRepo:         userRepo,
		clientMemberRepo: clientMemberRepo,
		clientRepo:       clientRepo,
	}
}

func (s *projectService) GetProject(id uuid.UUID) (*models.Project, error) {
	return s.projectRepo.GetByID(id)
}

func (s *projectService) GetAllProjects() ([]models.Project, error) {
	return s.projectRepo.GetAll()
}

// GetProjectsForUser returns all projects for admin/team_lead; for regular users only projects whose client has the user as a member.
func (s *projectService) GetProjectsForUser(userID uuid.UUID, role string) ([]models.Project, error) {
	all, err := s.projectRepo.GetAll()
	if err != nil {
		return nil, err
	}
	if role == string(models.RoleAdmin) || role == string(models.RoleTeamLead) {
		return all, nil
	}
	clientIDs, err := s.clientMemberRepo.GetClientIDsForUser(userID)
	if err != nil {
		return nil, err
	}
	if len(clientIDs) == 0 {
		return []models.Project{}, nil
	}
	set := make(map[uuid.UUID]bool)
	for _, id := range clientIDs {
		set[id] = true
	}
	var out []models.Project
	for _, p := range all {
		if p.ClientID != nil && set[*p.ClientID] {
			out = append(out, p)
		}
	}
	return out, nil
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
	if projectType, ok := updates["type"].(string); ok {
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
	if planningMonth, ok := updates["planning_month"].(int); ok {
		project.PlanningMonth = &planningMonth
	}
	if planningYear, ok := updates["planning_year"].(int); ok {
		project.PlanningYear = &planningYear
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

func (s *projectService) BulkCreateMonthlyProjects(month, year int, clientIDs []uuid.UUID, types []string, createdBy uuid.UUID, addClientMembers bool) ([]models.Project, error) {
	if month < 1 || month > 12 {
		return nil, fmt.Errorf("month must be 1-12")
	}
	clients, err := s.clientRepo.GetAll()
	if err != nil {
		return nil, err
	}
	if len(clientIDs) > 0 {
		set := make(map[uuid.UUID]bool)
		for _, id := range clientIDs {
			set[id] = true
		}
		var filtered []models.Client
		for _, c := range clients {
			if set[c.ID] {
				filtered = append(filtered, c)
			}
		}
		clients = filtered
	}
	if len(types) == 0 {
		types = []string{"Planner"}
	}
	existing, err := s.projectRepo.GetAll()
	if err != nil {
		return nil, err
	}
	existingSet := make(map[string]bool)
	for _, p := range existing {
		if p.ClientID != nil && p.PlanningMonth != nil && p.PlanningYear != nil {
			key := fmt.Sprintf("%s|%s|%d|%d", p.ClientID.String(), p.Type, *p.PlanningMonth, *p.PlanningYear)
			existingSet[key] = true
		}
	}
	monthName := monthNamesES[month]
	if monthName == "" {
		monthName = fmt.Sprintf("%d", month)
	}
	var created []models.Project
	for _, client := range clients {
		for _, typ := range types {
			key := fmt.Sprintf("%s|%s|%d|%d", client.ID.String(), typ, month, year)
			if existingSet[key] {
				continue
			}
			name := fmt.Sprintf("%s | %s | %s %d", client.Name, typ, monthName, year)
			proj := &models.Project{
				Name:          name,
				Type:          typ,
				Status:        models.ProjectStatusPlanning,
				PlanningMonth: &month,
				PlanningYear:  &year,
				ClientID:      &client.ID,
				CreatedBy:     createdBy,
			}
			if err := s.projectRepo.Create(proj); err != nil {
				return created, err
			}
			existingSet[key] = true
			created = append(created, *proj)
			if addClientMembers {
				members, _ := s.clientMemberRepo.GetByClientID(client.ID)
				for _, m := range members {
					_ = s.projectRepo.AddMember(proj.ID, m.UserID, "member")
				}
			}
		}
	}
	return created, nil
}
