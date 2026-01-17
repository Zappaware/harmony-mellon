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
     ```
     (Use your actual backend service URL from Step 2)

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
- `NEXT_PUBLIC_API_URL=<backend-public-url>/api/v1`

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
- Check CORS settings in backend (`FRONTEND_URL` must match frontend domain)
- Ensure backend has public domain generated

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
