# ProdKB: Fly.io Deployment Guide

This guide explains how to deploy the ProdKB stack to **Fly.io**. We will use separate Fly "apps" for the backend (which includes workers) and the frontend.

---

## 🛠️ Step 1: Install Fly Command Line
1. **Install flyctl**:
   - Windows (PowerShell): `iwr https://fly.io/install.ps1 -useb | iex`
2. **Log in**:
   - `fly auth login`

---

## 🗄️ Step 2: Databases (Postgres & Redis)
1. **Create Postgres**:
   - `fly postgres create`
   - Name it `prodkb-db`.
2. **Create Redis**:
   - `fly redis create`
   - Name it `prodkb-redis`.

---

## 🚀 Step 3: Backend Deployment (API + Workers)
The backend is configured to run the API, SLA Worker, and Webhook Worker as "Process Groups" in a single app.

1. **Navigate to the backend folder**: `cd backend`
2. **Launch the app**: `fly launch`
   - Choose a unique name (e.g., `prodkb-backend-xyz`).
   - When asked if you want to copy the Dockerfile configuration, say **Yes**.
   - When asked if you want to tweak settings, say **Yes** to verify the `fly.toml` looks correct.
3. **Set Secrets**:
   - `fly secrets set DATABASE_URL="..." REDIS_URL="..." JWT_SECRET="..."`
4. **Deploy**: `fly deploy`

---

## 🌐 Step 4: Frontend Deployment
1. **Navigate to the frontend folder**: `cd frontend`
2. **Launch the app**: `fly launch`
   - Choose a unique name (e.g., `prodkb-frontend-xyz`).
3. **Set Backend URL**:
   - `fly env set VITE_API_URL="https://prodkb-backend-xyz.fly.dev"`
4. **Deploy**: `fly deploy`

---

## 📋 Monitoring & Logs
- View status: `fly status`
- Tail logs: `fly logs`
- Open in browser: `fly open`

---

## 🏗️ Technical Note: Processes
Your `backend/fly.toml` is configured to start three different processes:
1. `api`: The main Express server.
2. `sla`: The background SLA enforcement worker.
3. `webhook`: The background webhook delivery worker.

Fly.io will automatically manage the health and scaling of all three!
