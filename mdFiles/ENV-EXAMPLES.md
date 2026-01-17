# Environment Variable Examples for Railway Production

## 🚨 Important Note

Based on your URLs:
- **Frontend**: `https://harmony-mellon-production.up.railway.app/`
- **Backend API**: `https://harmony-mellon-production.up.railway.app/api/v1`

**If both are on the same domain, you likely have two Railway services:**
1. **Frontend service** deployed to `harmony-mellon-production.up.railway.app`
2. **Backend service** deployed separately (check your Railway dashboard for its URL)

**The backend service typically has its own subdomain like:**
- `harmony-mellon-backend.up.railway.app` OR
- `your-backend-service.up.railway.app`

---

## 📋 Frontend `.env.local` File

**Location**: Root of the project (same level as `package.json`)

```env
# Railway Production - Frontend Environment Variables
# This file is for LOCAL development reference only
# In Railway, set these as environment variables in the service settings

NEXT_PUBLIC_API_URL=https://harmony-mellon-production.up.railway.app/api/v1
```

**⚠️ Important for Railway:**
- **Do NOT** create `.env.local` in production - Railway doesn't use it
- Instead, go to Railway Dashboard → Your Frontend Service → Variables tab
- Add `NEXT_PUBLIC_API_URL` as an environment variable there
- Value should be: `https://your-backend-service.up.railway.app/api/v1`
  - Replace `your-backend-service` with your actual backend Railway service URL

**If your backend is on the same domain** (unusual but possible):
```env
NEXT_PUBLIC_API_URL=https://harmony-mellon-production.up.railway.app/api/v1
```

---

## 📋 Backend `.env` File

**Location**: `backend/.env` (inside the backend folder)

```env
# Railway Production - Backend Environment Variables
# This file is for LOCAL development reference only
# In Railway, set these as environment variables in the service settings

# Server Configuration
PORT=8080

# Database (Railway PostgreSQL service URL)
# Railway automatically provides this when you add a PostgreSQL service
DATABASE_URL=postgres://postgres:password@postgres.railway.internal:5432/railway?sslmode=disable
# OR if using external PostgreSQL:
# DATABASE_URL=postgres://user:password@hostname:5432/dbname?sslmode=require

# JWT Secret (IMPORTANT: Use a strong, random secret in production!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-minimum-32-characters

# Frontend URL (for CORS configuration)
FRONTEND_URL=https://harmony-mellon-production.up.railway.app

# Environment
ENVIRONMENT=production

# Email Configuration (Optional - for email notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com
SMTP_FROM_NAME=Mellon Harmony
```

**⚠️ Important for Railway:**
- **Do NOT** commit `.env` files to git
- Go to Railway Dashboard → Your Backend Service → Variables tab
- Add each variable separately in Railway

---

## 🔍 How to Find Your Actual Backend URL in Railway

1. Go to [Railway Dashboard](https://railway.app)
2. Open your **Backend Service** (not frontend)
3. Go to **Settings** → **Networking** → **Public Domain**
4. Copy the URL (e.g., `https://harmony-mellon-backend.up.railway.app`)
5. Your `NEXT_PUBLIC_API_URL` should be: `https://harmony-mellon-backend.up.railway.app/api/v1`

---

## ✅ Railway Configuration Checklist

### Frontend Service (in Railway Dashboard → Variables)
- [ ] `NEXT_PUBLIC_API_URL=https://your-backend-service.up.railway.app/api/v1`

### Backend Service (in Railway Dashboard → Variables)
- [ ] `PORT=8080`
- [ ] `DATABASE_URL=...` (Railway auto-provides this when you add PostgreSQL)
- [ ] `JWT_SECRET=...` (generate a strong random secret)
- [ ] `FRONTEND_URL=https://harmony-mellon-production.up.railway.app`
- [ ] `ENVIRONMENT=production`

---

## 🧪 Test Your Configuration

### 1. Test Backend Health
```bash
# Replace with your actual backend URL
curl https://your-backend-service.up.railway.app/health
# Should return: {"status":"ok"}
```

### 2. Test Backend API
```bash
curl https://your-backend-service.up.railway.app/api/v1/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
# Should return token and user data
```

### 3. Check Frontend in Browser Console
1. Open your production frontend: `https://harmony-mellon-production.up.railway.app`
2. Open DevTools (F12) → Console
3. Type: `console.log(process.env.NEXT_PUBLIC_API_URL)`
4. Should show your backend URL, NOT `http://localhost:8080`

---

## 🚀 After Setting Variables in Railway

1. **Redeploy Frontend**: Railway will auto-redeploy when you add variables
   - OR manually: Service → Deployments → Redeploy
2. **Redeploy Backend**: Service → Deployments → Redeploy
3. **Clear Browser Cache**: Or use incognito mode to test
4. **Test Login**: Try logging in with test credentials

---

## 💡 Quick Reference

| Variable | Frontend | Backend | Example Value |
|----------|----------|---------|---------------|
| `NEXT_PUBLIC_API_URL` | ✅ Yes | ❌ No | `https://backend.up.railway.app/api/v1` |
| `FRONTEND_URL` | ❌ No | ✅ Yes | `https://frontend.up.railway.app` |
| `DATABASE_URL` | ❌ No | ✅ Yes | `postgres://...` (auto-provided by Railway) |
| `JWT_SECRET` | ❌ No | ✅ Yes | `your-secret-key-here` |
| `ENVIRONMENT` | ❌ No | ✅ Yes | `production` |
| `PORT` | ❌ No | ✅ Yes | `8080` |
