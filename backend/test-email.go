//go:build ignore
// +build ignore

package main

import (
	"fmt"
	"mellon-harmony-api/internal/config"
	"mellon-harmony-api/internal/service"
	"os"
)

// Script de prueba para verificar la configuración de email
// Uso: go run test-email.go
func main() {
	// Cargar configuración
	cfg := config.Load()

	// Verificar que las variables estén configuradas
	if cfg.SMTPUser == "" || cfg.SMTPPassword == "" {
		fmt.Println("❌ ERROR: Variables de email no configuradas")
		fmt.Println("\nPor favor, configura estas variables en tu archivo .env:")
		fmt.Println("  SMTP_HOST")
		fmt.Println("  SMTP_PORT")
		fmt.Println("  SMTP_USER")
		fmt.Println("  SMTP_PASSWORD")
		fmt.Println("  SMTP_FROM")
		fmt.Println("  SMTP_FROM_NAME")
		os.Exit(1)
	}

	fmt.Println("📧 Probando configuración de email...")
	fmt.Printf("  Host: %s\n", cfg.SMTPHost)
	fmt.Printf("  Port: %s\n", cfg.SMTPPort)
	fmt.Printf("  User: %s\n", cfg.SMTPUser)
	fmt.Printf("  From: %s\n", cfg.SMTPFrom)
	fmt.Println()

	// Crear servicio de email
	emailService := service.NewEmailService(cfg)

	// Obtener email de prueba desde argumentos o usar uno por defecto
	testEmail := "test@example.com"
	if len(os.Args) > 1 {
		testEmail = os.Args[1]
	}

	fmt.Printf("📨 Enviando email de prueba a: %s\n", testEmail)

	// Enviar email de prueba
	err := emailService.SendEmail(
		testEmail,
		"Prueba de Email - Mellon Harmony",
		`
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="UTF-8">
			<style>
				body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
				.container { max-width: 600px; margin: 0 auto; padding: 20px; }
				.header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
				.content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
			</style>
		</head>
		<body>
			<div class="container">
				<div class="header">
					<h1>✅ Email de Prueba</h1>
				</div>
				<div class="content">
					<p>¡Felicitaciones! Tu configuración de email está funcionando correctamente.</p>
					<p>Si recibiste este email, significa que:</p>
					<ul>
						<li>✅ La conexión SMTP está configurada correctamente</li>
						<li>✅ Las credenciales son válidas</li>
						<li>✅ El servidor puede enviar emails</li>
					</ul>
					<p>Tu sistema de notificaciones por email está listo para usar.</p>
				</div>
			</div>
		</body>
		</html>
		`,
	)

	if err != nil {
		fmt.Printf("❌ ERROR al enviar email: %v\n", err)
		fmt.Println("\nPosibles causas:")
		fmt.Println("  1. Credenciales incorrectas")
		fmt.Println("  2. Servidor SMTP no accesible")
		fmt.Println("  3. Puerto bloqueado por firewall")
		fmt.Println("  4. Para Gmail: necesitas usar contraseña de aplicación")
		os.Exit(1)
	}

	fmt.Println("✅ Email enviado exitosamente!")
	fmt.Printf("   Revisa la bandeja de entrada de: %s\n", testEmail)
	fmt.Println("   (También revisa la carpeta de spam)")
}
