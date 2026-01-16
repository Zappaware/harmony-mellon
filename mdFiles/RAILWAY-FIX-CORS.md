# Fix: CORS and localhost Error in Railway Production

## 🔍 Problem

When deploying to Railway, you're seeing this error:
```
Access to fetch at 'http://localhost:8080/api/v1/auth/login' from origin 'https://harmony-mellon-production.up.railway.app' has been blocked by CORS policy
```

This happens because:
1. **`NEXT_PUBLIC_API_URL` environment variable is NOT set** in Railway
2. The app falls back to `http://localhost:8080/api/v1` (default value)
3. Production frontend (HTTPS) cannot access localhost (HTTP) due to CORS/browser security

## ✅ Solution

### Step 1: Get Your Backend URL from Railway

1. Go to [Railway Dashboard](https://railway.app)
2. Open your **backend** service/project
3. Go to **Settings** → **Networking**
4. Find your **Public Domain** (e.g., `https://your-backend.up.railway.app`)
5. Copy this URL

### Step 2: Set Environment Variable in Frontend Service

1. In Railway, open your **frontend** service/project
2. Go to **Variables** tab
3. Click **+ New Variable**
4. Add:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://your-backend.up.railway.app/api/v1`
     - Replace `your-backend.up.railway.app` with your actual backend domain
     - **Important**: Must include `/api/v1` at the end
   - **Environment**: Select **Production** (and **Preview** if you want it for preview deployments)
5. Click **Add**

### Step 3: Set Environment Variable in Backend Service (CORS)

1. In Railway, open your **backend** service/project
2. Go to **Variables** tab
3. Add or verify:
   - **Key**: `FRONTEND_URL`
   - **Value**: `https://harmony-mellon-production.up.railway.app`
     - Replace with your actual frontend domain
   - **Environment**: **Production**
4. Add or verify:
   - **Key**: `ENVIRONMENT`
   - **Value**: `production`
   - **Environment**: **Production**

### Step 4: Redeploy

After setting the environment variables:

1. **Frontend**: Railway will automatically redeploy when you add variables, OR
   - Go to your frontend service → **Deployments** → **Redeploy**
2. **Backend**: Go to your backend service → **Deployments** → **Redeploy**

**Important**: Environment variables are available at **build time** for Next.js (`NEXT_PUBLIC_*`), so you MUST redeploy after adding them.

## 🔍 Verification

### 1. Check Environment Variables in Railway

Frontend service should have:
- ✅ `NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app/api/v1`

Backend service should have:
- ✅ `FRONTEND_URL=https://your-frontend.up.railway.app`
- ✅ `ENVIRONMENT=production`

### 2. Check in Browser Console

1. Open your production site: `https://harmony-mellon-production.up.railway.app`
2. Open DevTools (F12) → Console
3. Run: `console.log(process.env.NEXT_PUBLIC_API_URL)`
4. Should show: `https://your-backend.up.railway.app/api/v1`
   - **NOT** `http://localhost:8080/api/v1`

### 3. Test Login

1. Try to login with test credentials:
   - Email: `admin@example.com`
   - Password: `admin123`
2. Should work without CORS errors
3. Check Network tab in DevTools - requests should go to your production backend, not localhost

### 4. Test Session Persistence

1. Login successfully
2. Refresh the page (F5)
3. Should stay logged in (not redirect to login page)

## 🐛 Troubleshooting

### Error: Still seeing localhost in console

**Problem**: `NEXT_PUBLIC_API_URL` not set or redeploy didn't happen

**Solution**:
1. Verify the variable is set in Railway (check spelling: `NEXT_PUBLIC_API_URL`)
2. **Redeploy the frontend** - Next.js builds environment variables at build time
3. Clear browser cache or try incognito mode

### Error: CORS still blocking

**Problem**: Backend CORS not configured correctly

**Solution**:
1. Verify `FRONTEND_URL` is set in backend service
2. Verify `ENVIRONMENT=production` is set in backend
3. Check backend logs in Railway for CORS errors
4. Verify backend domain is correct and accessible:
   ```bash
   curl https://your-backend.up.railway.app/health
   ```

### Error: "Network error: Cannot connect to backend"

**Problem**: Backend URL is incorrect or backend is down

**Solution**:
1. Test backend directly: `curl https://your-backend.up.railway.app/health`
2. Verify backend service is running in Railway
3. Check backend logs for errors
4. Verify `NEXT_PUBLIC_API_URL` has correct URL (with `/api/v1` at the end)

### Error: Token not persisting on reload

**Problem**: Session restore failing due to network errors

**Solution**:
- This should be fixed once `NEXT_PUBLIC_API_URL` is set correctly
- The improved error handling now distinguishes between network errors and auth errors
- Network errors won't clear the token unnecessarily

## 📝 Example Configuration

### Frontend Service (Railway)
```
NEXT_PUBLIC_API_URL=https://mellon-harmony-api.up.railway.app/api/v1
```

### Backend Service (Railway)
```
PORT=8080
DATABASE_URL=postgres://...
JWT_SECRET=your-secret-key
FRONTEND_URL=https://harmony-mellon-production.up.railway.app
ENVIRONMENT=production
```

## ✅ Checklist

- [ ] `NEXT_PUBLIC_API_URL` is set in Railway frontend service
- [ ] URL includes `/api/v1` at the end
- [ ] URL uses `https://` (not `http://`)
- [ ] `FRONTEND_URL` is set in Railway backend service
- [ ] `ENVIRONMENT=production` is set in Railway backend service
- [ ] Frontend has been redeployed after adding variable
- [ ] Backend is accessible: `curl https://your-backend.up.railway.app/health`
- [ ] No localhost URLs in browser console
- [ ] Login works without CORS errors
- [ ] Session persists after page reload

## 🚀 After Fix

Once configured correctly:
- ✅ Login works from production frontend
- ✅ No CORS errors
- ✅ Session persists after page reload
- ✅ All API calls go to production backend
- ✅ Token is stored correctly in localStorage
