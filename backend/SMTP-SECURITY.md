# Seguridad SMTP: Mejores Prácticas

## ⚠️ Problema: No Poner Tu Contraseña Personal en el Código

**NUNCA** pongas tu contraseña personal de Gmail/Outlook en el archivo `.env` que se sube a GitHub o se usa en producción.

## ✅ Soluciones Seguras

### Opción 1: Variables de Entorno en Railway (Recomendado para Deployment)

Railway permite configurar variables de entorno desde su dashboard sin necesidad de ponerlas en el código:

1. **En Railway Dashboard**:
   - Ve a tu proyecto → **Variables**
   - Agrega las variables SMTP ahí
   - Railway las inyecta automáticamente

**Ventajas**:
- ✅ No se sube al código
- ✅ No se ve en GitHub
- ✅ Solo existe en Railway
- ✅ Fácil de cambiar sin tocar código

**Configuración en Railway**:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASSWORD=tu-contraseña-de-aplicación
SMTP_FROM=tu-email@gmail.com
SMTP_FROM_NAME=Mellon Harmony
```

### Opción 2: Crear Correo Dedicado para la Aplicación

Crea un correo **específico solo para la aplicación**:

1. **Gmail**: Crea `mellon.harmony@gmail.com` (o similar)
2. **Outlook**: Crea `noreply@mellon.mx` (si tienes dominio)
3. Usa ese correo **solo** para enviar emails de la app

**Ventajas**:
- ✅ No es tu correo personal
- ✅ Si se compromete, no afecta tu cuenta personal
- ✅ Puedes crear contraseñas de aplicación específicas
- ✅ Fácil de desactivar si es necesario

**Configuración**:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=mellon.harmony@gmail.com
SMTP_PASSWORD=contraseña-de-aplicación-de-ese-correo
SMTP_FROM=mellon.harmony@gmail.com
SMTP_FROM_NAME=Mellon Harmony
```

### Opción 3: Usar Servicio Profesional (MEJOR PRÁCTICA) ⭐

Usa servicios como **SendGrid**, **Mailgun** o **Amazon SES**. **NO requieren tu contraseña personal**:

#### SendGrid (Gratis hasta 100 emails/día)

1. **Crear cuenta**: https://sendgrid.com
2. **Crear API Key**: Settings → API Keys → Create API Key
3. **Configurar**:

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.tu-api-key-aqui  # NO es tu contraseña personal
SMTP_FROM=noreply@mellon.mx
SMTP_FROM_NAME=Mellon Harmony
```

**Ventajas**:
- ✅ **NO usas tu contraseña personal**
- ✅ Usa API key (más seguro)
- ✅ Mejor deliverability (menos spam)
- ✅ Dashboard para monitorear envíos
- ✅ Escalable
- ✅ Plan gratuito generoso

#### Mailgun (Gratis hasta 5,000 emails/mes)

1. **Crear cuenta**: https://mailgun.com
2. **Obtener credenciales SMTP**: Dashboard → Sending → SMTP credentials
3. **Configurar**:

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@mg.mellon.mx
SMTP_PASSWORD=tu-contraseña-de-mailgun  # NO es tu contraseña personal
SMTP_FROM=noreply@mellon.mx
SMTP_FROM_NAME=Mellon Harmony
```

#### Amazon SES (Muy económico: $0.10 por 1,000 emails)

1. **Crear cuenta AWS**: https://aws.amazon.com/ses
2. **Crear credenciales SMTP**: SES → SMTP settings
3. **Configurar**:

```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=tu-access-key-id
SMTP_PASSWORD=tu-secret-access-key  # NO es tu contraseña personal
SMTP_FROM=noreply@mellon.mx
SMTP_FROM_NAME=Mellon Harmony
```

### Opción 4: Asegurar que .env NO se Suba a GitHub

**CRÍTICO**: Asegúrate de que `.env` esté en `.gitignore`:

```gitignore
# Environment variables
.env
.env.local
.env.production
.env.*.local
```

**Verificar**:
```bash
# Verificar que .env está en .gitignore
cat .gitignore | grep .env

# Verificar que .env no está en git
git status | grep .env
```

Si `.env` aparece en `git status`, **NO lo commitees**. Elimínalo del tracking:
```bash
git rm --cached .env
```

## 🎯 Recomendación Final

### Para Desarrollo Local:
1. Crea un correo dedicado (ej: `mellon.harmony@gmail.com`)
2. Genera contraseña de aplicación para ese correo
3. Ponla en `.env` local (que NO se sube a GitHub)

### Para Producción (Railway):
1. **Mejor opción**: Usa SendGrid o Mailgun
   - Crea cuenta en SendGrid
   - Obtén API key
   - Configúrala en Railway Variables (NO en código)

2. **Alternativa**: Usa correo dedicado
   - Crea correo solo para producción
   - Configura contraseña de aplicación
   - Ponla en Railway Variables (NO en código)

## 📋 Checklist de Seguridad

- [ ] `.env` está en `.gitignore`
- [ ] `.env` NO está en el repositorio de GitHub
- [ ] Variables de producción están en Railway Variables (no en código)
- [ ] No usas tu contraseña personal
- [ ] Usas contraseña de aplicación o API key
- [ ] Tienes un correo dedicado o servicio profesional

## 🔒 Configuración Segura en Railway

### Paso 1: Crear Variables en Railway
1. Ve a tu proyecto en Railway
2. Click en **Variables**
3. Agrega cada variable:
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASSWORD`
   - `SMTP_FROM`
   - `SMTP_FROM_NAME`

### Paso 2: Verificar que NO están en el Código
```bash
# Verificar que no hay contraseñas en el código
grep -r "SMTP_PASSWORD" --exclude-dir=node_modules --exclude="*.md" .
# No debería mostrar nada (o solo comentarios)
```

### Paso 3: Railway las Inyecta Automáticamente
Railway automáticamente inyecta las variables de entorno cuando despliegas. No necesitas ponerlas en el código.

## ⚠️ Qué NO Hacer

❌ **NO** pongas tu contraseña personal en `.env`
❌ **NO** commitees `.env` a GitHub
❌ **NO** pongas contraseñas en el código
❌ **NO** uses la misma contraseña para desarrollo y producción
❌ **NO** compartas contraseñas en chats o emails

## ✅ Qué SÍ Hacer

✅ Usa variables de entorno en Railway
✅ Usa servicios profesionales (SendGrid, Mailgun)
✅ Crea correos dedicados para la aplicación
✅ Usa contraseñas de aplicación (no contraseñas normales)
✅ Mantén `.env` en `.gitignore`
✅ Rota contraseñas periódicamente
✅ Usa diferentes credenciales para desarrollo y producción

## 📚 Recursos

- **SendGrid**: https://sendgrid.com
- **Mailgun**: https://mailgun.com
- **Amazon SES**: https://aws.amazon.com/ses
- **Railway Variables**: https://docs.railway.app/develop/variables

## 🎯 Resumen

**El problema**: No quieres poner tu contraseña personal en el código.

**La solución**:
1. **Desarrollo**: Correo dedicado + `.env` local (no en GitHub)
2. **Producción**: SendGrid/Mailgun + Railway Variables (no en código)

**Resultado**: Tu contraseña personal nunca está en el código ni en GitHub. ✅
