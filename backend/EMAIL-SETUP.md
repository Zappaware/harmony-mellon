# Configuración del Sistema de Notificaciones por Email

El sistema de notificaciones por email envía correos automáticamente cuando ocurren eventos importantes en la aplicación.

## Eventos que Envían Emails

### Usuarios
- **Creación de usuario**: Email de bienvenida con credenciales
- **Actualización de usuario**: Email con los cambios realizados
- **Eliminación de usuario**: Email de confirmación

### Tareas (Issues)
- **Creación de tarea**: Email al creador
- **Actualización de tarea**: Email al creador y asignado (si existe)
- **Asignación de tarea**: Email al usuario asignado

### Proyectos
- **Creación de proyecto**: Email al creador
- **Actualización de proyecto**: Email al creador con los cambios

### Notificaciones
- **Nueva notificación**: Email cuando se crea una notificación en el sistema

## Configuración

### Variables de Entorno

Agrega las siguientes variables a tu archivo `.env`:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASSWORD=tu-contraseña-de-aplicación
SMTP_FROM=tu-email@gmail.com
SMTP_FROM_NAME=Mellon Harmony
```

### Configuración para Gmail

1. **Habilitar contraseñas de aplicación**:
   - Ve a tu cuenta de Google
   - Seguridad → Verificación en 2 pasos (debe estar activada)
   - Contraseñas de aplicaciones → Generar nueva contraseña
   - Usa esta contraseña en `SMTP_PASSWORD`

2. **Configuración SMTP**:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   ```

### Configuración para Otros Proveedores

#### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
```

#### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=tu-api-key-de-sendgrid
```

#### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=tu-usuario
SMTP_PASSWORD=tu-contraseña
```

#### Amazon SES
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=tu-access-key
SMTP_PASSWORD=tu-secret-key
```

## Modo de Desarrollo

Si no configuras las variables de email, el sistema funcionará normalmente pero **no enviará emails**. Esto es útil para desarrollo local.

En producción, asegúrate de configurar todas las variables de email.

## Templates de Email

Los templates de email están definidos en `internal/service/email_service.go` y son HTML responsivos con estilos modernos.

Cada template incluye:
- Header con gradiente de color según el tipo de evento
- Contenido personalizado con la información relevante
- Botones de acción para acceder a la aplicación
- Footer con información de la empresa

## Personalización

Para personalizar los templates de email, edita la función `getEmailTemplate()` en `internal/service/email_service.go`.

## Troubleshooting

### Los emails no se envían

1. **Verifica las variables de entorno**: Asegúrate de que todas las variables SMTP estén configuradas
2. **Revisa los logs**: Los errores de envío se registran en los logs del servidor
3. **Verifica credenciales**: Asegúrate de que las credenciales SMTP sean correctas
4. **Firewall/Red**: Algunos proveedores bloquean conexiones SMTP desde ciertas IPs

### Emails van a spam

1. **Configura SPF/DKIM**: Configura registros DNS para tu dominio
2. **Usa un servicio profesional**: Considera usar SendGrid, Mailgun o Amazon SES
3. **Evita spam**: No envíes demasiados emails en poco tiempo

## Seguridad

- **Nunca commitees** las credenciales SMTP en el código
- Usa variables de entorno o un gestor de secretos
- En producción, usa contraseñas de aplicación o API keys
- Considera usar servicios de email profesionales para mejor deliverability
