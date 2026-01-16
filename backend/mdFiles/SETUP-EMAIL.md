# Guía Rápida: Configurar Email para Mellon Harmony

## Pasos Rápidos

### 1. Copiar archivo de ejemplo

```bash
cd backend
cp .env.example .env
```

### 2. Editar archivo .env

Abre el archivo `.env` y configura las variables de email según tu proveedor.

### 3. Probar la configuración

```bash
# Probar con email por defecto
go run test-email.go

# O probar con tu email
go run test-email.go tu-email@mellon.mx
```

### 4. Verificar que funciona

- Revisa tu bandeja de entrada
- Si no aparece, revisa la carpeta de spam
- Si hay errores, revisa los logs

## Configuración por Proveedor

### Gmail (Solo para desarrollo)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASSWORD=tu-contraseña-de-aplicación
SMTP_FROM=tu-email@gmail.com
SMTP_FROM_NAME=Mellon Harmony
```

**Nota:** Necesitas crear una "Contraseña de aplicación" en tu cuenta de Google.

### SendGrid (Recomendado para mellon.mx)

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.tu-api-key-aqui
SMTP_FROM=noreply@mellon.mx
SMTP_FROM_NAME=Mellon Harmony
```

### Mailgun

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@mg.mellon.mx
SMTP_PASSWORD=tu-contraseña
SMTP_FROM=noreply@mellon.mx
SMTP_FROM_NAME=Mellon Harmony
```

## Para Dominio Personalizado (mellon.mx)

Lee la guía completa en: [CUSTOM-DOMAIN-EMAIL.md](./CUSTOM-DOMAIN-EMAIL.md)

## Verificación

Una vez configurado, el sistema enviará emails automáticamente cuando:
- ✅ Se crea un nuevo usuario
- ✅ Se actualiza un usuario
- ✅ Se elimina un usuario
- ✅ Se crea una tarea
- ✅ Se actualiza una tarea
- ✅ Se asigna una tarea
- ✅ Se crea un proyecto
- ✅ Se actualiza un proyecto
- ✅ Se crea una notificación

## Troubleshooting

### No se envían emails

1. Verifica que todas las variables SMTP estén en `.env`
2. Ejecuta `go run test-email.go` para probar
3. Revisa los logs del servidor para errores

### Emails van a spam

1. Configura SPF/DKIM/DMARC en tu DNS
2. Usa un servicio profesional (SendGrid, Mailgun)
3. Verifica tu dominio con el proveedor

### Error de autenticación

1. Verifica usuario y contraseña
2. Para Gmail: usa contraseña de aplicación
3. Para servicios profesionales: usa API keys

## Siguiente Paso

Si usas `mellon.mx`, sigue la guía en [CUSTOM-DOMAIN-EMAIL.md](./CUSTOM-DOMAIN-EMAIL.md) para configurar tu dominio personalizado.
