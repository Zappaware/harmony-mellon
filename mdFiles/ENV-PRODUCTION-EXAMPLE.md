# Production Environment Variables - Examples

## 🎯 Your Railway Setup

Based on your information:
- **Frontend URL**: `https://harmony-mellon-production.up.railway.app/`
- **Backend API**: `https://harmony-mellon-production.up.railway.app/api/v1`

⚠️ **Important**: If your backend is at the same domain, you likely have two separate Railway services. Find your backend service's URL in Railway Dashboard.

---

## 📝 Frontend `.env.local` File (Root Directory)

**Location**: `/home/sergeycerv/Documents/harmony-mellon/.env.local`

```env
# Production API URL
NEXT_PUBLIC_API_URL=https://harmony-mellon-production.up.railway.app/api/v1
```

**⚠️ For Railway Production:**
- Do NOT create `.env.local` in production
- Instead, set this in Railway: **Frontend Service → Variables → Add Variable**
- Key: `NEXT_PUBLIC_API_URL`
- Value: `https://your-backend-service.up.railway.app/api/v1`
  - ⚠️ Replace `your-backend-service` with your actual backend Railway URL

**How to find your backend URL:**
1. Go to Railway Dashboard
2. Open your **Backend Service** (separate from frontend)
3. Go to **Settings → Networking → Public Domain**
4. Copy that URL and add `/api/v1` at the end

---

## 📝 Backend `.env` File (`backend/` Directory)

**Location**: `/home/sergeycerv/Documents/harmony-mellon/backend/.env`

```env
# Server Configuration
PORT=8080

# Database (Railway PostgreSQL - usually auto-provided)
DATABASE_URL=postgres://postgres:password@postgres.railway.internal:5432/railway?sslmode=disable

# JWT Secret (CHANGE THIS TO A STRONG RANDOM SECRET!)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long-change-this

# Frontend URL (for CORS)
FRONTEND_URL=https://harmony-mellon-production.up.railway.app

# Environment
ENVIRONMENT=production

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com
SMTP_FROM_NAME=Mellon Harmony
```

**⚠️ For Railway Production:**
- Do NOT commit `.env` files to git
- Set these in Railway: **Backend Service → Variables**
- Railway usually auto-provides `DATABASE_URL` when you add PostgreSQL

---

## 🔍 How to Check Your Backend URL

If you're not sure what your backend Railway URL is:

1. **Check Railway Dashboard**:
   - Open Railway Dashboard
   - Look at your services list
   - Find the backend service (usually named like "backend", "api", or similar)
   - Click on it → Settings → Networking
   - Find "Public Domain" - that's your backend URL

2. **Test if backend is accessible**:
   ```bash
   # Replace with your backend URL
   curl https://your-backend-service.up.railway.app/health
   # Should return: {"status":"ok"}
   ```

3. **Common Railway backend URL patterns**:
   - `https://harmony-mellon-backend.up.railway.app`
   - `https://harmony-mellon-api.up.railway.app`
   - `https://mellon-harmony-api.up.railway.app`

---

## ✅ Railway Configuration Steps

### Frontend Service (Railway)
1. Go to Railway Dashboard → Your Frontend Service
2. Click **Variables** tab
3. Add Variable:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://your-backend-service.up.railway.app/api/v1`
   - **Environment**: Production (and Preview if needed)
4. Click **Add**
5. **Redeploy** the frontend service (Railway may auto-redeploy)

### Backend Service (Railway)
1. Go to Railway Dashboard → Your Backend Service
2. Click **Variables** tab
3. Add/Verify these variables:
   - `PORT=8080`
   - `DATABASE_URL` (usually auto-provided by Railway when you add PostgreSQL)
   - `JWT_SECRET=your-strong-random-secret-here`
   - `FRONTEND_URL=https://harmony-mellon-production.up.railway.app`
   - `ENVIRONMENT=production`
4. Click **Add** for each
5. **Redeploy** the backend service

---

## 🧪 Test After Configuration

1. **Test Backend Health**:
   ```bash
   curl https://your-backend-service.up.railway.app/health
   ```

2. **Check Frontend in Browser**:
   - Open: `https://harmony-mellon-production.up.railway.app`
   - Open DevTools (F12) → Console
   - Type: `console.log(process.env.NEXT_PUBLIC_API_URL)`
   - Should show your backend URL (NOT `http://localhost:8080`)

3. **Test Login**:
   - Try logging in with: `admin@example.com` / `admin123`
   - Should work without CORS errors

---

## ❌ Common Mistakes

1. ❌ **Using localhost in production**: `http://localhost:8080/api/v1`
   - ✅ Fix: Use your Railway backend URL

2. ❌ **Missing `/api/v1` at the end**: `https://backend.up.railway.app`
   - ✅ Fix: `https://backend.up.railway.app/api/v1`

3. ❌ **Using `http://` instead of `https://`**:
   - ✅ Fix: Always use `https://` in production

4. ❌ **Not redeploying after adding variables**:
   - ✅ Fix: Redeploy both services after adding environment variables

5. ❌ **Backend `FRONTEND_URL` doesn't match**:
   - ✅ Fix: Should be exactly `https://harmony-mellon-production.up.railway.app` (no trailing slash)

---

## 📋 Quick Copy-Paste for Railway Variables

### Frontend Service Variables:
```
NEXT_PUBLIC_API_URL=https://your-backend-service.up.railway.app/api/v1
```

### Backend Service Variables:
```
PORT=8080
FRONTEND_URL=https://harmony-mellon-production.up.railway.app
ENVIRONMENT=production
JWT_SECRET=change-this-to-a-strong-random-secret
```

(`DATABASE_URL` is usually auto-provided by Railway when you add PostgreSQL service)
