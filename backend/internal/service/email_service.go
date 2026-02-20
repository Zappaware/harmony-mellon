package service

import (
	"bytes"
	"fmt"
	"net/smtp"
	"strings"
)

// EmailService sends emails (e.g. password reset).
type EmailService interface {
	SendPasswordResetEmail(toEmail, userName, resetLink string) error
	IsConfigured() bool
}

type emailService struct {
	host     string
	port     string
	user     string
	password string
	from     string
	fromName string
}

// EmailConfig holds SMTP settings.
type EmailConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	From     string
	FromName string
}

func NewEmailService(cfg EmailConfig) EmailService {
	return &emailService{
		host:     cfg.Host,
		port:     cfg.Port,
		user:     cfg.User,
		password: cfg.Password,
		from:     cfg.From,
		fromName: cfg.FromName,
	}
}

func (s *emailService) IsConfigured() bool {
	return strings.TrimSpace(s.host) != "" && strings.TrimSpace(s.from) != ""
}

func (s *emailService) SendPasswordResetEmail(toEmail, userName, resetLink string) error {
	if !s.IsConfigured() {
		return fmt.Errorf("email is not configured: set SMTP_HOST, SMTP_FROM and related env vars to send password reset emails")
	}

	addr := s.host + ":" + s.port
	auth := smtp.PlainAuth("", s.user, s.password, s.host)

	fromHeader := s.from
	if s.fromName != "" {
		fromHeader = s.fromName + " <" + s.from + ">"
	}

	subject := "Restablecer contraseña - Mellon Harmony"
	body := fmt.Sprintf(`Hola %s,

Recibimos una solicitud para restablecer la contraseña de tu cuenta en Mellon Harmony.

Haz clic en el siguiente enlace para elegir una nueva contraseña (válido durante 1 hora):

%s

Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña no será modificada.

— Mellon Harmony
`, userName, resetLink)

	var msg bytes.Buffer
	msg.WriteString("From: " + fromHeader + "\r\n")
	msg.WriteString("To: " + toEmail + "\r\n")
	msg.WriteString("Subject: " + subject + "\r\n")
	msg.WriteString("Content-Type: text/plain; charset=UTF-8\r\n")
	msg.WriteString("\r\n")
	msg.WriteString(body)

	return smtp.SendMail(addr, auth, s.from, []string{toEmail}, msg.Bytes())
}
