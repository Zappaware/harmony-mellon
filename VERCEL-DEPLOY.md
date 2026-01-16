# Guía de Despliegue en Vercel

## Prerrequisitos

1. **Cuenta de Vercel**: Crea una cuenta en [vercel.com](https://vercel.com) (puedes usar GitHub para registrarte)

2. **Repositorio Git**: Asegúrate de que tu código esté en un repositorio Git (GitHub, GitLab, o Bitbucket)

3. **Backend desplegado**: Necesitarás la URL del backend API desplegado (ej: Railway, Render, Fly.io, etc.)

## Pasos para Desplegar

### Opción 1: Despliegue desde GitHub (Recomendado)

1. **Sube tu código a GitHub**:
   ```bash
   git remote add origin <tu-repositorio-github>
   git push -u origin main
   ```

2. **Conecta con Vercel**:
   - Ve a [vercel.com](https://vercel.com)
   - Haz clic en "Add New..." → "Project"
   - Importa tu repositorio de GitHub
   - Vercel detectará automáticamente que es un proyecto Next.js

3. **Configuración del Proyecto**:
   - **Framework Preset**: Next.js (debería detectarse automáticamente)
   - **Root Directory**: `./` (dejar por defecto)
   - **Build Command**: `npm run build` (debería estar por defecto)
   - **Output Directory**: `.next` (debería estar por defecto)
   - **Install Command**: `npm install` (debería estar por defecto)

4. **Variables de Entorno**:
   Agrega la siguiente variable de entorno en la sección "Environment Variables":
   ```
   NEXT_PUBLIC_API_URL=https://tu-backend-url.com/api/v1
   ```
   Reemplaza `https://tu-backend-url.com` con la URL real de tu backend desplegado.

5. **Desplegar**:
   - Haz clic en "Deploy"
   - Vercel construirá y desplegará tu aplicación automáticamente
   - Una vez completado, obtendrás una URL como: `https://tu-proyecto.vercel.app`

### Opción 2: Despliegue desde CLI

1. **Instala Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Inicia sesión**:
   ```bash
   vercel login
   ```

3. **Despliega**:
   ```bash
   vercel
   ```
   Sigue las instrucciones en la terminal:
   - ¿Set up and deploy? → **Y**
   - ¿Which scope? → Selecciona tu cuenta
   - ¿Link to existing project? → **N** (primera vez)
   - ¿What's your project's name? → `mellon-harmony` (o el nombre que prefieras)
   - ¿In which directory is your code located? → `./`
   - ¿Want to override the settings? → **N**

4. **Configura Variables de Entorno**:
   ```bash
   vercel env add NEXT_PUBLIC_API_URL
   ```
   Ingresa el valor: `https://tu-backend-url.com/api/v1`

5. **Redespliega**:
   ```bash
   vercel --prod
   ```

## Configuración Importante

### Variables de Entorno Necesarias

- `NEXT_PUBLIC_API_URL`: URL completa del backend API
  - Ejemplo: `https://mellon-harmony-api.railway.app/api/v1`
  - O: `https://mellon-harmony-api.onrender.com/api/v1`

### Configuración de CORS en el Backend

Asegúrate de que tu backend Go tenga configurado CORS para permitir requests desde tu dominio de Vercel:

```go
// En tu backend/main.go
config := cors.DefaultConfig()
config.AllowOrigins = []string{
    "https://tu-proyecto.vercel.app",
    "http://localhost:3000", // Para desarrollo local
}
```

## Despliegue del Backend

El backend en Go necesita ser desplegado por separado. Opciones recomendadas:

### Opción 1: Railway (Recomendado)
1. Ve a [railway.app](https://railway.app)
2. Conecta tu repositorio
3. Selecciona el directorio `backend/`
4. Railway detectará automáticamente que es Go
5. Configura las variables de entorno (DATABASE_URL, JWT_SECRET, etc.)
6. Despliega

### Opción 2: Render
1. Ve a [render.com](https://render.com)
2. Crea un nuevo "Web Service"
3. Conecta tu repositorio
4. Configura:
   - **Build Command**: `cd backend && go build -o app`
   - **Start Command**: `cd backend && ./app`
   - **Root Directory**: `backend/`
5. Configura variables de entorno
6. Despliega

### Opción 3: Fly.io
1. Instala Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. En el directorio `backend/`: `fly launch`
3. Sigue las instrucciones
4. Despliega: `fly deploy`

## Verificación Post-Despliegue

1. **Verifica que el frontend carga correctamente**
2. **Verifica que las llamadas API funcionan** (abre DevTools → Network)
3. **Prueba el login y otras funcionalidades**
4. **Verifica que CORS está configurado correctamente**

## Dominio Personalizado (Opcional)

1. Ve a tu proyecto en Vercel Dashboard
2. Settings → Domains
3. Agrega tu dominio personalizado
4. Sigue las instrucciones para configurar DNS

## Actualizaciones Futuras

Cada vez que hagas `git push` a la rama `main`, Vercel desplegará automáticamente una nueva versión.

Para desplegar manualmente:
```bash
vercel --prod
```

## Troubleshooting

### Error: "API request failed"
- Verifica que `NEXT_PUBLIC_API_URL` esté configurada correctamente
- Verifica que el backend esté desplegado y accesible
- Verifica CORS en el backend

### Error: "Build failed"
- Revisa los logs de build en Vercel Dashboard
- Verifica que todas las dependencias estén en `package.json`
- Asegúrate de que el build funciona localmente: `npm run build`

### Error: "Module not found"
- Verifica que todos los imports usen rutas correctas
- Verifica que `tsconfig.json` tenga las rutas configuradas correctamente

## Recursos

- [Documentación de Vercel](https://vercel.com/docs)
- [Next.js en Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Variables de Entorno en Vercel](https://vercel.com/docs/environment-variables)
