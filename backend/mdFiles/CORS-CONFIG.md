# Configuración de CORS para Producción

El backend está configurado para manejar CORS de forma flexible según el entorno.

## Variables de Entorno

### Desarrollo (por defecto)
- **ENVIRONMENT**: `development` (por defecto)
- En desarrollo, CORS permite **todos los orígenes** para facilitar el desarrollo local

### Producción
Para producción, configura las siguientes variables de entorno:

```bash
ENVIRONMENT=production
FRONTEND_URL=https://tu-proyecto.vercel.app
```

## Configuración por Plataforma

### Railway
1. Ve a tu proyecto en Railway
2. Settings → Variables
3. Agrega:
   - `ENVIRONMENT=production`
   - `FRONTEND_URL=https://tu-proyecto.vercel.app`

### Render
1. Ve a tu servicio en Render Dashboard
2. Environment → Environment Variables
3. Agrega:
   - `ENVIRONMENT=production`
   - `FRONTEND_URL=https://tu-proyecto.vercel.app`

### Fly.io
1. Usa el CLI de Fly:
   ```bash
   fly secrets set ENVIRONMENT=production
   fly secrets set FRONTEND_URL=https://tu-proyecto.vercel.app
   ```

### Docker / Otra plataforma
Agrega las variables de entorno en tu archivo `.env` o configuración de contenedor:
```env
ENVIRONMENT=production
FRONTEND_URL=https://tu-proyecto.vercel.app
```

## Orígenes Permitidos

En producción, el backend permitirá requests desde:
- `http://localhost:3000` (desarrollo local)
- `http://localhost:3001` (desarrollo local alternativo)
- La URL especificada en `FRONTEND_URL` (tu frontend en Vercel)

## Múltiples Orígenes

Si necesitas permitir múltiples orígenes (por ejemplo, staging y producción), puedes modificar `main.go` para leer múltiples URLs desde una variable de entorno separada por comas:

```go
// Ejemplo para múltiples orígenes
frontendURLs := strings.Split(cfg.FrontendURL, ",")
allowedOrigins = append(allowedOrigins, frontendURLs...)
```

Y configurar:
```bash
FRONTEND_URL=https://staging.vercel.app,https://production.vercel.app
```

## Verificación

Para verificar que CORS está configurado correctamente:

1. **Desde el navegador** (DevTools → Network):
   - Verifica que las requests incluyan el header `Origin`
   - Verifica que las respuestas incluyan `Access-Control-Allow-Origin`

2. **Desde la terminal**:
   ```bash
   curl -H "Origin: https://tu-proyecto.vercel.app" \
        -H "Access-Control-Request-Method: GET" \
        -H "Access-Control-Request-Headers: authorization" \
        -X OPTIONS \
        https://tu-backend-url.com/api/v1/issues
   ```

   Deberías recibir headers CORS en la respuesta.

## Troubleshooting

### Error: "CORS policy: No 'Access-Control-Allow-Origin' header"
- Verifica que `ENVIRONMENT=production` esté configurado
- Verifica que `FRONTEND_URL` tenga la URL correcta (sin trailing slash)
- Verifica que la URL del frontend coincida exactamente (incluyendo https/http)

### Error: "CORS policy: Credentials flag is true"
- El backend ya está configurado con `AllowCredentials: true`
- Asegúrate de que el frontend también envíe `credentials: 'include'` en las requests fetch

### Múltiples dominios
Si necesitas permitir múltiples dominios, modifica `main.go` para parsear una lista separada por comas.
