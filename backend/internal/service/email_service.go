package service

import (
	"bytes"
	"fmt"
	"html/template"
	"mellon-harmony-api/internal/config"
	"net/smtp"
)

type EmailService interface {
	SendEmail(to, subject, body string) error
	SendUserCreatedEmail(to, name, password string) error
	SendUserDeletedEmail(to, name string) error
	SendUserUpdatedEmail(to, name string, changes []string) error
	SendIssueCreatedEmail(to, issueTitle, issueID string) error
	SendIssueUpdatedEmail(to, issueTitle, issueID string, changes []string) error
	SendIssueAssignedEmail(to, issueTitle, issueID, assignerName string) error
	SendProjectCreatedEmail(to, projectName, projectID string) error
	SendProjectUpdatedEmail(to, projectName, projectID string, changes []string) error
	SendNotificationEmail(to, notificationTitle, notificationMessage, notificationID string) error
}

type emailService struct {
	config *config.Config
}

func NewEmailService(cfg *config.Config) EmailService {
	return &emailService{config: cfg}
}

func (s *emailService) SendEmail(to, subject, body string) error {
	// Skip email sending if SMTP is not configured
	if s.config.SMTPUser == "" || s.config.SMTPPassword == "" {
		return nil // Silently skip in development
	}

	from := s.config.SMTPFrom
	if from == "" {
		from = s.config.SMTPUser
	}

	// Setup authentication
	auth := smtp.PlainAuth("", s.config.SMTPUser, s.config.SMTPPassword, s.config.SMTPHost)

	// Create email message
	msg := []byte(fmt.Sprintf("From: %s <%s>\r\n", s.config.SMTPFromName, from) +
		fmt.Sprintf("To: %s\r\n", to) +
		fmt.Sprintf("Subject: %s\r\n", subject) +
		"MIME-Version: 1.0\r\n" +
		"Content-Type: text/html; charset=UTF-8\r\n" +
		"\r\n" +
		body)

	// Send email
	addr := fmt.Sprintf("%s:%s", s.config.SMTPHost, s.config.SMTPPort)
	err := smtp.SendMail(addr, auth, from, []string{to}, msg)
	if err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}

	return nil
}

func (s *emailService) renderTemplate(templateName string, data interface{}) (string, error) {
	tmpl, err := template.New(templateName).Parse(getEmailTemplate(templateName))
	if err != nil {
		return "", err
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		return "", err
	}

	return buf.String(), nil
}

func (s *emailService) SendUserCreatedEmail(to, name, password string) error {
	body, err := s.renderTemplate("user_created", map[string]interface{}{
		"Name":     name,
		"Email":    to,
		"Password": password,
		"AppURL":   s.config.FrontendURL,
	})
	if err != nil {
		return err
	}

	return s.SendEmail(to, "Bienvenido a Mellon Harmony", body)
}

func (s *emailService) SendUserDeletedEmail(to, name string) error {
	body, err := s.renderTemplate("user_deleted", map[string]interface{}{
		"Name": name,
	})
	if err != nil {
		return err
	}

	return s.SendEmail(to, "Tu cuenta ha sido eliminada", body)
}

func (s *emailService) SendUserUpdatedEmail(to, name string, changes []string) error {
	body, err := s.renderTemplate("user_updated", map[string]interface{}{
		"Name":    name,
		"Changes": changes,
		"AppURL":  s.config.FrontendURL,
	})
	if err != nil {
		return err
	}

	return s.SendEmail(to, "Tu cuenta ha sido actualizada", body)
}

func (s *emailService) SendIssueCreatedEmail(to, issueTitle, issueID string) error {
	body, err := s.renderTemplate("issue_created", map[string]interface{}{
		"IssueTitle": issueTitle,
		"IssueID":    issueID,
		"IssueURL":   fmt.Sprintf("%s/issue/%s", s.config.FrontendURL, issueID),
		"AppURL":     s.config.FrontendURL,
	})
	if err != nil {
		return err
	}

	return s.SendEmail(to, fmt.Sprintf("Nueva tarea: %s", issueTitle), body)
}

func (s *emailService) SendIssueUpdatedEmail(to, issueTitle, issueID string, changes []string) error {
	body, err := s.renderTemplate("issue_updated", map[string]interface{}{
		"IssueTitle": issueTitle,
		"IssueID":    issueID,
		"Changes":    changes,
		"IssueURL":   fmt.Sprintf("%s/issue/%s", s.config.FrontendURL, issueID),
		"AppURL":     s.config.FrontendURL,
	})
	if err != nil {
		return err
	}

	return s.SendEmail(to, fmt.Sprintf("Tarea actualizada: %s", issueTitle), body)
}

func (s *emailService) SendIssueAssignedEmail(to, issueTitle, issueID, assignerName string) error {
	body, err := s.renderTemplate("issue_assigned", map[string]interface{}{
		"IssueTitle":   issueTitle,
		"IssueID":      issueID,
		"AssignerName": assignerName,
		"IssueURL":     fmt.Sprintf("%s/issue/%s", s.config.FrontendURL, issueID),
		"AppURL":       s.config.FrontendURL,
	})
	if err != nil {
		return err
	}

	return s.SendEmail(to, fmt.Sprintf("Te han asignado una tarea: %s", issueTitle), body)
}

func (s *emailService) SendProjectCreatedEmail(to, projectName, projectID string) error {
	body, err := s.renderTemplate("project_created", map[string]interface{}{
		"ProjectName": projectName,
		"ProjectID":   projectID,
		"ProjectURL":  fmt.Sprintf("%s/proyectos", s.config.FrontendURL),
		"AppURL":      s.config.FrontendURL,
	})
	if err != nil {
		return err
	}

	return s.SendEmail(to, fmt.Sprintf("Nuevo proyecto: %s", projectName), body)
}

func (s *emailService) SendProjectUpdatedEmail(to, projectName, projectID string, changes []string) error {
	body, err := s.renderTemplate("project_updated", map[string]interface{}{
		"ProjectName": projectName,
		"ProjectID":   projectID,
		"Changes":     changes,
		"ProjectURL":  fmt.Sprintf("%s/proyectos", s.config.FrontendURL),
		"AppURL":      s.config.FrontendURL,
	})
	if err != nil {
		return err
	}

	return s.SendEmail(to, fmt.Sprintf("Proyecto actualizado: %s", projectName), body)
}

func (s *emailService) SendNotificationEmail(to, notificationTitle, notificationMessage, notificationID string) error {
	body, err := s.renderTemplate("notification", map[string]interface{}{
		"Title":    notificationTitle,
		"Message":  notificationMessage,
		"AppURL":   s.config.FrontendURL,
		"NotifURL": fmt.Sprintf("%s/notificaciones", s.config.FrontendURL),
	})
	if err != nil {
		return err
	}

	return s.SendEmail(to, notificationTitle, body)
}

// Email templates
func getEmailTemplate(templateName string) string {
	templates := map[string]string{
		"user_created": `
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<style>
		body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
		.container { max-width: 600px; margin: 0 auto; padding: 20px; }
		.header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
		.content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
		.button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
		.footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<h1>Bienvenido a Mellon Harmony</h1>
		</div>
		<div class="content">
			<p>Hola <strong>{{.Name}}</strong>,</p>
			<p>Tu cuenta ha sido creada exitosamente. Aquí están tus credenciales:</p>
			<ul>
				<li><strong>Email:</strong> {{.Email}}</li>
				<li><strong>Contraseña temporal:</strong> {{.Password}}</li>
			</ul>
			<p>Por favor, cambia tu contraseña después de iniciar sesión por primera vez.</p>
			<a href="{{.AppURL}}" class="button">Acceder a Mellon Harmony</a>
			<p style="margin-top: 20px; color: #666; font-size: 14px;">Si no solicitaste esta cuenta, puedes ignorar este correo.</p>
		</div>
		<div class="footer">
			<p>© 2024 Mellon Harmony. Todos los derechos reservados.</p>
		</div>
	</div>
</body>
</html>`,
		"user_deleted": `
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<style>
		body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
		.container { max-width: 600px; margin: 0 auto; padding: 20px; }
		.header { background: #ef4444; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
		.content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
		.footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<h1>Cuenta Eliminada</h1>
		</div>
		<div class="content">
			<p>Hola <strong>{{.Name}}</strong>,</p>
			<p>Tu cuenta en Mellon Harmony ha sido eliminada.</p>
			<p>Si crees que esto fue un error, por favor contacta al administrador del sistema.</p>
		</div>
		<div class="footer">
			<p>© 2024 Mellon Harmony. Todos los derechos reservados.</p>
		</div>
	</div>
</body>
</html>`,
		"user_updated": `
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<style>
		body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
		.container { max-width: 600px; margin: 0 auto; padding: 20px; }
		.header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
		.content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
		.changes { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
		.button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
		.footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<h1>Cuenta Actualizada</h1>
		</div>
		<div class="content">
			<p>Hola <strong>{{.Name}}</strong>,</p>
			<p>Tu cuenta ha sido actualizada. Los siguientes cambios se han realizado:</p>
			<div class="changes">
				<ul>
					{{range .Changes}}
					<li>{{.}}</li>
					{{end}}
				</ul>
			</div>
			<a href="{{.AppURL}}" class="button">Ver mi cuenta</a>
		</div>
		<div class="footer">
			<p>© 2024 Mellon Harmony. Todos los derechos reservados.</p>
		</div>
	</div>
</body>
</html>`,
		"issue_created": `
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<style>
		body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
		.container { max-width: 600px; margin: 0 auto; padding: 20px; }
		.header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
		.content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
		.button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
		.footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<h1>Nueva Tarea Creada</h1>
		</div>
		<div class="content">
			<p>Se ha creado una nueva tarea:</p>
			<h2 style="color: #1d4ed8;">{{.IssueTitle}}</h2>
			<p>ID: <code>{{.IssueID}}</code></p>
			<a href="{{.IssueURL}}" class="button">Ver Tarea</a>
		</div>
		<div class="footer">
			<p>© 2024 Mellon Harmony. Todos los derechos reservados.</p>
		</div>
	</div>
</body>
</html>`,
		"issue_updated": `
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<style>
		body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
		.container { max-width: 600px; margin: 0 auto; padding: 20px; }
		.header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
		.content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
		.changes { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
		.button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
		.footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<h1>Tarea Actualizada</h1>
		</div>
		<div class="content">
			<p>La tarea <strong>{{.IssueTitle}}</strong> ha sido actualizada:</p>
			<div class="changes">
				<ul>
					{{range .Changes}}
					<li>{{.}}</li>
					{{end}}
				</ul>
			</div>
			<a href="{{.IssueURL}}" class="button">Ver Tarea</a>
		</div>
		<div class="footer">
			<p>© 2024 Mellon Harmony. Todos los derechos reservados.</p>
		</div>
	</div>
</body>
</html>`,
		"issue_assigned": `
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<style>
		body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
		.container { max-width: 600px; margin: 0 auto; padding: 20px; }
		.header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
		.content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
		.button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
		.footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<h1>Nueva Tarea Asignada</h1>
		</div>
		<div class="content">
			<p><strong>{{.AssignerName}}</strong> te ha asignado una nueva tarea:</p>
			<h2 style="color: #059669;">{{.IssueTitle}}</h2>
			<a href="{{.IssueURL}}" class="button">Ver Tarea</a>
		</div>
		<div class="footer">
			<p>© 2024 Mellon Harmony. Todos los derechos reservados.</p>
		</div>
	</div>
</body>
</html>`,
		"project_created": `
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<style>
		body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
		.container { max-width: 600px; margin: 0 auto; padding: 20px; }
		.header { background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
		.content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
		.button { display: inline-block; padding: 12px 24px; background: #8b5cf6; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
		.footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<h1>Nuevo Proyecto Creado</h1>
		</div>
		<div class="content">
			<p>Se ha creado un nuevo proyecto:</p>
			<h2 style="color: #6d28d9;">{{.ProjectName}}</h2>
			<a href="{{.ProjectURL}}" class="button">Ver Proyectos</a>
		</div>
		<div class="footer">
			<p>© 2024 Mellon Harmony. Todos los derechos reservados.</p>
		</div>
	</div>
</body>
</html>`,
		"project_updated": `
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<style>
		body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
		.container { max-width: 600px; margin: 0 auto; padding: 20px; }
		.header { background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
		.content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
		.changes { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
		.button { display: inline-block; padding: 12px 24px; background: #8b5cf6; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
		.footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<h1>Proyecto Actualizado</h1>
		</div>
		<div class="content">
			<p>El proyecto <strong>{{.ProjectName}}</strong> ha sido actualizado:</p>
			<div class="changes">
				<ul>
					{{range .Changes}}
					<li>{{.}}</li>
					{{end}}
				</ul>
			</div>
			<a href="{{.ProjectURL}}" class="button">Ver Proyectos</a>
		</div>
		<div class="footer">
			<p>© 2024 Mellon Harmony. Todos los derechos reservados.</p>
		</div>
	</div>
</body>
</html>`,
		"notification": `
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<style>
		body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
		.container { max-width: 600px; margin: 0 auto; padding: 20px; }
		.header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
		.content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
		.button { display: inline-block; padding: 12px 24px; background: #f59e0b; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
		.footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<h1>{{.Title}}</h1>
		</div>
		<div class="content">
			<p>{{.Message}}</p>
			<a href="{{.NotifURL}}" class="button">Ver Notificaciones</a>
		</div>
		<div class="footer">
			<p>© 2024 Mellon Harmony. Todos los derechos reservados.</p>
		</div>
	</div>
</body>
</html>`,
	}

	return templates[templateName]
}
