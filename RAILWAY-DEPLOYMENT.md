# Railway Deployment Guide

This guide explains how to deploy Mellon Harmony to Railway, which works differently from Docker Compose.

## 🚨 Important: Railway vs Docker Compose

**Railway does NOT use docker-compose.yml or bash scripts.** Railway:
- Builds from Dockerfiles directly
- Deploys services separately (not via docker-compose)
- Provides managed PostgreSQL automatically
- Uses environment variables from Railway dashboard

Your `scripts/run-docker.sh` is for **local development only**. For Railway, you'll deploy services separately through the Railway dashboard.

---

## 📋 Option 1: Separate Services (Recommended - Matches Docker Compose)

This matches your docker-compose setup with 3 services.

### Step 1: Create PostgreSQL Service

1. Go to Railway Dashboard → **New Project** → **Empty Project**
2. Click **+ New** → **Database** → **PostgreSQL**
3. Railway automatically creates and configures PostgreSQL
4. Note the connection details (will be in `DATABASE_URL` environment variable)

### Step 2: Create Backend Service

1. In same Railway project, click **+ New** → **GitHub Repo**
2. Connect your repository
3. Select your repository
4. Railway will detect the service - click **Add Service**
5. Configure the backend service:
   - **Settings** → **Source**:
     - Root Directory: `backend/`
   - **Settings** → **Deploy**:
     - Build Command: (auto-detected from Dockerfile)
     - Start Command: `./main`
   - **Settings** → **Networking**:
     - Click **Generate Domain** to create public URL (e.g., `harmony-mellon-backend.up.railway.app`)
   - **Variables** tab - Add these:
     ```
     PORT=8080
     DATABASE_URL=${{Postgres.DATABASE_URL}}
     JWT_SECRET=your-strong-random-secret-minimum-32-characters
     FRONTEND_URL=https://harmony-mellon-production.up.railway.app
     ENVIRONMENT=production
     ```

### Step 3: Create Frontend Service

1. In same Railway project, click **+ New** → **GitHub Repo**
2. Connect your repository (same repo)
3. Configure the frontend service:
   - **Settings** → **Source**:
     - Root Directory: `/` (root - leave empty)
   - **Settings** → **Deploy**:
     - Build Command: (auto-detected from Dockerfile)
     - Start Command: `node server.js`
   - **Settings** → **Networking**:
     - Click **Generate Domain** to create public URL (e.g., `harmony-mellon-production.up.railway.app`)
   - **Variables** tab - Add:
     ```
     NEXT_PUBLIC_API_URL=https://harmony-mellon-backend.up.railway.app/api/v1
     NEXT_TELEMETRY_DISABLED=1
     ```
     (Use your actual backend service URL from Step 2)
     
     **⚠️ IMPORTANT**: `NEXT_PUBLIC_API_URL` must be set in Railway Variables **before building**. Railway automatically passes all environment variables as build arguments (`ARG`) to the Dockerfile during the build process. The Dockerfile uses `ARG` and `ENV` to make these available at build time for Next.js.

### Step 4: Link PostgreSQL to Backend

1. Go to **Backend Service** → **Variables**
2. Railway should auto-detect `${{Postgres.DATABASE_URL}}`
3. If not, manually add: `DATABASE_URL=${{Postgres.DATABASE_URL}}`

---

## 📋 Option 2: Single Combined Service

If you want everything in one service (like your docker-compose but combined):

### Create Combined Dockerfile

See the combined Dockerfile approach (separate file/documentation).

**Pros:**
- Single service to manage
- Simpler deployment

**Cons:**
- Can't scale frontend/backend independently
- Both share resources
- More complex Dockerfile

---

## 🔧 Build Arguments and Environment Variables in Railway

### How Railway Handles Docker Build Arguments

Railway automatically passes all environment variables from the **Variables** tab as build arguments to your Dockerfile during the build process. This is crucial for Next.js applications that need `NEXT_PUBLIC_*` variables at build time.

### Frontend Dockerfile (Next.js)

The frontend Dockerfile uses `ARG` and `ENV` to accept build-time variables:

```dockerfile
# Accept build arguments for NEXT_PUBLIC_* variables
ARG NEXT_PUBLIC_API_URL
ARG NEXT_TELEMETRY_DISABLED=1

# Set environment variables for build
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=$NEXT_TELEMETRY_DISABLED

# Build Next.js
RUN npm run build
```

**How it works:**
1. Railway reads variables from the **Variables** tab
2. Railway automatically passes them as `--build-arg` to `docker build`
3. The Dockerfile `ARG` statements receive these values
4. `ENV` statements make them available during the build process
5. Next.js can access `NEXT_PUBLIC_*` variables during `npm run build`

### Setting Variables in Railway

1. Go to your **Frontend Service** → **Variables** tab
2. Add variables (Railway will automatically pass them as build args):
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app/api/v1
   NEXT_TELEMETRY_DISABLED=1
   ```
3. **Important**: Set these variables **before** the first deployment
4. If you change `NEXT_PUBLIC_API_URL`, Railway will automatically rebuild with the new value

### Backend Dockerfile (Go)

The backend Dockerfile doesn't need build arguments - it uses runtime environment variables:
- Variables are read at runtime when the Go application starts
- No `ARG` statements needed in the Dockerfile
- Just set variables in Railway's **Variables** tab

### Key Differences

| Type | When Used | How Set in Railway | Dockerfile Syntax |
|------|-----------|-------------------|-------------------|
| **Build-time** (Next.js) | During `npm run build` | Variables tab (auto-passed as ARG) | `ARG` + `ENV` |
| **Runtime** (Go/Node) | When app starts | Variables tab | Just `ENV` or read from env |

### Common Issues

**❌ Problem**: `NEXT_PUBLIC_API_URL` is undefined in production
- **Cause**: Variable not set in Railway before build
- **Fix**: Add variable in Railway Variables tab, then redeploy

**❌ Problem**: Build succeeds but app uses wrong API URL
- **Cause**: Variable changed after build
- **Fix**: Change variable in Railway, which triggers automatic rebuild

**❌ Problem**: Build fails with "NEXT_PUBLIC_API_URL is not set"
- **Cause**: Variable missing from Railway Variables
- **Fix**: Add `NEXT_PUBLIC_API_URL` to Variables tab before deploying

---

## 🔧 Railway Configuration Files

We've created these Railway configuration files:

1. **`railway.json`** (root) - For frontend service
2. **`backend/railway.json`** - For backend service

These help Railway understand how to build and deploy your services.

---

## 🚀 Deployment Steps

### First Time Setup:

1. **Create Railway Account**: https://railway.app
2. **Create New Project**: "Mellon Harmony" (or your preferred name)
3. **Add PostgreSQL Service**: Click **+ New** → **Database** → **PostgreSQL**
4. **Add Backend Service**:
   - Click **+ New** → **GitHub Repo**
   - Connect your repo
   - Root Directory: `backend/`
   - Set environment variables (see Step 2 above)
   - Generate public domain
5. **Add Frontend Service**:
   - Click **+ New** → **GitHub Repo**
   - Connect same repo
   - Root Directory: `/` (leave empty)
   - Set `NEXT_PUBLIC_API_URL` to backend's public URL
   - Generate public domain

### Environment Variables Summary:

**Backend Service:**
- `PORT=8080`
- `DATABASE_URL=${{Postgres.DATABASE_URL}}` (auto-linked)
- `JWT_SECRET=<your-secret>`
- `FRONTEND_URL=<frontend-public-url>`
- `ENVIRONMENT=production`

**Frontend Service:**
- `NEXT_PUBLIC_API_URL=<backend-public-url>/api/v1` (⚠️ Required at build time - must be set before first deployment)
- `NEXT_TELEMETRY_DISABLED=1` (optional, disables Next.js telemetry)

---

## 📊 Comparison: Docker Compose vs Railway

| Docker Compose | Railway |
|---------------|---------|
| `docker-compose up` | Deploy services separately |
| `scripts/run-docker.sh` | Railway dashboard / CLI |
| 3 services in one file | 3 services in Railway project |
| Local volumes | Railway managed PostgreSQL |
| Manual environment vars | Railway Variables tab |

---

## ✅ After Deployment

1. **Check Backend Health**:
   ```bash
   curl https://your-backend.up.railway.app/health
   ```

2. **Check Frontend**:
   Visit your frontend URL in browser

3. **View Logs**:
   Railway Dashboard → Service → **Deployments** → Click deployment → **View Logs**

---

## 🔍 Troubleshooting

**Backend not deploying?**
- Check Root Directory is set to `backend/`
- Verify `DATABASE_URL` is set (should auto-link from PostgreSQL)
- Check build logs in Railway

**Frontend can't connect to backend?**
- Verify `NEXT_PUBLIC_API_URL` matches backend's public domain
- **Check if variable was set before build**: If you added `NEXT_PUBLIC_API_URL` after the first build, you need to redeploy (Railway will auto-rebuild)
- Check CORS settings in backend (`FRONTEND_URL` must match frontend domain)
- Ensure backend has public domain generated
- Check browser console for errors about `NEXT_PUBLIC_API_URL` being undefined

**Database connection issues?**
- PostgreSQL service must be created first
- Backend must reference `${{Postgres.DATABASE_URL}}`
- Check Railway logs for connection errors

---

## 💡 Pro Tips

1. **Use Railway CLI** for easier management:
   ```bash
   npm i -g @railway/cli
   railway login
   railway link
   railway up
   ```

2. **Environment Variables**: Railway automatically links services if you use `${{ServiceName.VAR}}`

3. **Custom Domains**: You can add custom domains in Settings → Networking

4. **Preview Deployments**: Railway auto-creates preview environments for pull requests

---

## 📝 Notes

- Your `docker-compose.yml` and `scripts/run-docker.sh` are **still useful for local development**
- Railway deployment is **separate** from Docker Compose
- PostgreSQL is **managed by Railway** - no need to deploy it separately
- Both services use their respective **Dockerfiles** that already exist in your repo
