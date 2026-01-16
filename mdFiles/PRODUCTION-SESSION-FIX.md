# Fix: Problema de Sesión en Producción

## 🔍 Problema

Al actualizar la página (F5) en producción, te redirige al login aunque tengas una sesión activa.

## ✅ Solución Aplicada

Se mejoró el manejo de restauración de sesión para:
1. **Solo limpiar token si es error 401** (autenticación), no si es error de red
2. **Evitar redirección prematura** con un pequeño delay
3. **Mejor detección** de errores de red vs errores de autenticación

## 🔧 Verificaciones Necesarias en Producción

### 1. Verificar Variable de Entorno `NEXT_PUBLIC_API_URL`

**En Railway/Vercel/Plataforma de deployment:**

Asegúrate de que la variable `NEXT_PUBLIC_API_URL` esté configurada correctamente:

```bash
# Ejemplo para Railway
NEXT_PUBLIC_API_URL=https://tu-backend.railway.app/api/v1

# Ejemplo para Vercel
NEXT_PUBLIC_API_URL=https://tu-backend.railway.app/api/v1
```

**Verificar en el navegador:**
1. Abre las DevTools (F12)
2. Ve a Console
3. Escribe: `console.log(process.env.NEXT_PUBLIC_API_URL)`
4. Debe mostrar la URL de tu backend

### 2. Verificar CORS en el Backend

El backend debe permitir requests desde tu dominio de producción.

**En `backend/main.go`**, verifica que CORS esté configurado:

```go
allowedOrigins := []string{
    "http://localhost:3000",
    "http://localhost:3001",
    "https://tu-frontend.vercel.app",  // Tu dominio de producción
    "https://tu-frontend.railway.app",  // Si usas Railway para frontend
}

// O en producción, usar FRONTEND_URL desde variables de entorno
if cfg.FrontendURL != "" {
    allowedOrigins = append(allowedOrigins, cfg.FrontendURL)
}
```

**Configurar en Railway (Backend):**
```bash
FRONTEND_URL=https://tu-frontend.vercel.app
```

### 3. Verificar que el Backend Esté Accesible

Prueba acceder directamente a tu backend:

```bash
# Debe responder con {"status":"ok"}
curl https://tu-backend.railway.app/health

# Debe responder con 401 (porque no hay token, pero debe responder)
curl https://tu-backend.railway.app/api/v1/auth/me
```

### 4. Verificar Token en localStorage

En el navegador:
1. Abre DevTools (F12)
2. Ve a Application → Local Storage
3. Verifica que existe `token` con un valor

Si no existe, el problema es que el token no se está guardando correctamente.

## 🐛 Debugging

### Ver Logs en el Navegador

Abre la consola del navegador y busca:
- Errores de red (CORS, 404, 500)
- Mensajes de "Failed to restore session"
- Errores de "Authorization header required"

### Ver Logs del Backend

En Railway, ve a tu servicio backend → Logs y busca:
- Errores de autenticación
- Errores de CORS
- Errores de base de datos

## 🔄 Flujo de Restauración de Sesión

1. **Usuario carga la página**
2. **AppContext verifica token en localStorage**
3. **Si hay token, llama a `/api/v1/auth/me`**
4. **Si la respuesta es exitosa, restaura la sesión**
5. **Si hay error 401, limpia el token y redirige a login**
6. **Si hay error de red, mantiene el token (puede ser temporal)**

## ⚠️ Errores Comunes

### Error: "Network error: Unable to reach server"
**Causa**: `NEXT_PUBLIC_API_URL` no está configurada o es incorrecta
**Solución**: Configura la variable en tu plataforma de deployment

### Error: "CORS policy"
**Causa**: El backend no permite requests desde tu dominio
**Solución**: Agrega tu dominio a `allowedOrigins` en el backend

### Error: "401 Unauthorized"
**Causa**: El token es inválido o expirado
**Solución**: El usuario debe iniciar sesión nuevamente

### Error: "content-scripts.js"
**Causa**: Extensión del navegador (no es tu código)
**Solución**: Ignorar, no afecta la funcionalidad

## ✅ Checklist de Verificación

- [ ] `NEXT_PUBLIC_API_URL` está configurada en producción
- [ ] `FRONTEND_URL` está configurada en el backend
- [ ] CORS permite tu dominio de producción
- [ ] Backend está accesible (prueba `/health`)
- [ ] Token se guarda en localStorage después de login
- [ ] No hay errores de red en la consola del navegador

## 🚀 Próximos Pasos

1. **Verifica las variables de entorno** en tu plataforma de deployment
2. **Prueba el flujo completo**:
   - Login
   - Actualizar página (F5)
   - Debe mantener la sesión
3. **Revisa los logs** si sigue fallando

## 📝 Notas

- El error de `content-scripts.js` es de una extensión del navegador y se puede ignorar
- Los cambios aplicados mejoran el manejo de errores pero no solucionan problemas de configuración
- Si el problema persiste, verifica que todas las variables de entorno estén correctamente configuradas
