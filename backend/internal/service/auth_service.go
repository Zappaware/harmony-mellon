package service

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"log"
	"mellon-harmony-api/internal/models"
	"mellon-harmony-api/internal/repository"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

const resetTokenExpiry = time.Hour

// ErrEmailNotConfigured is returned when SMTP is not set and a reset email cannot be sent.
var ErrEmailNotConfigured = errors.New("email is not configured: set SMTP_HOST, SMTP_FROM and related env vars to send password reset emails")
// ErrInvalidResetToken is returned when the reset token is invalid or expired.
var ErrInvalidResetToken = errors.New("el enlace ha expirado o no es válido")

type AuthService interface {
	Login(email, password string) (string, *models.User, error)
	Register(name, email, password string, role models.UserRole) (*models.User, error)
	GenerateToken(user *models.User) (string, error)
	RequestPasswordReset(email string) error
	ResetPassword(token, newPassword string) error
}

type authService struct {
	userRepo     repository.UserRepository
	jwtSecret    string
	emailService EmailService
	frontendURL  string
}

func NewAuthService(userRepo repository.UserRepository, jwtSecret string, emailService EmailService, frontendURL string) AuthService {
	return &authService{
		userRepo:     userRepo,
		jwtSecret:    jwtSecret,
		emailService: emailService,
		frontendURL:  strings.TrimSuffix(frontendURL, "/"),
	}
}

func (s *authService) Login(email, password string) (string, *models.User, error) {
	user, err := s.userRepo.GetByEmail(email)
	if err != nil {
		return "", nil, errors.New("invalid credentials")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return "", nil, errors.New("invalid credentials")
	}

	token, err := s.GenerateToken(user)
	if err != nil {
		return "", nil, err
	}

	return token, user, nil
}

func (s *authService) Register(name, email, password string, role models.UserRole) (*models.User, error) {
	// Check if user already exists
	_, err := s.userRepo.GetByEmail(email)
	if err == nil {
		return nil, errors.New("user with this email already exists")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// Create user
	user := &models.User{
		Name:     name,
		Email:    email,
		Password: string(hashedPassword),
		Role:     role,
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, err
	}

	// Clear password before returning
	user.Password = ""
	return user, nil
}

func (s *authService) GenerateToken(user *models.User) (string, error) {
	claims := jwt.MapClaims{
		"user_id": user.ID.String(),
		"email":   user.Email,
		"role":    string(user.Role),
		"exp":     time.Now().Add(time.Hour * 24 * 7).Unix(), // 7 days
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.jwtSecret))
}

func (s *authService) RequestPasswordReset(email string) error {
	user, err := s.userRepo.GetByEmail(email)
	if err != nil {
		// Do not reveal whether the email exists
		return nil
	}

	if s.emailService == nil || !s.emailService.IsConfigured() {
		log.Printf("Password reset requested for %s but email is not configured", email)
		return ErrEmailNotConfigured
	}
	if s.frontendURL == "" {
		log.Printf("Password reset requested but FRONTEND_URL is not set")
		return errors.New("FRONTEND_URL no está configurado; no se puede generar el enlace de restablecimiento")
	}

	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		return errors.New("no se pudo generar el enlace de recuperación")
	}
	token := hex.EncodeToString(tokenBytes)
	expiresAt := time.Now().Add(resetTokenExpiry)
	user.PasswordResetToken = &token
	user.PasswordResetExpiresAt = &expiresAt
	if err := s.userRepo.Update(user); err != nil {
		log.Printf("Failed to save reset token: %v", err)
		return errors.New("no se pudo procesar la solicitud")
	}

	resetLink := s.frontendURL + "/restablecer-contrasena?token=" + token

	if err := s.emailService.SendPasswordResetEmail(user.Email, user.Name, resetLink); err != nil {
		log.Printf("Failed to send password reset email to %s: %v", user.Email, err)
		return errors.New("no se pudo enviar el correo. Verifica la configuración SMTP del servidor.")
	}
	return nil
}

func (s *authService) ResetPassword(token, newPassword string) error {
	if len(newPassword) < 6 {
		return errors.New("la contraseña debe tener al menos 6 caracteres")
	}
	user, err := s.userRepo.GetByPasswordResetToken(token)
	if err != nil {
		return ErrInvalidResetToken
	}
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return errors.New("no se pudo actualizar la contraseña")
	}
	user.Password = string(hashedPassword)
	user.PasswordResetToken = nil
	user.PasswordResetExpiresAt = nil
	if err := s.userRepo.Update(user); err != nil {
		return errors.New("no se pudo actualizar la contraseña")
	}
	return nil
}
