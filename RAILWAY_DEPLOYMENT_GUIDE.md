# ProdKB: Railway Deployment Guide

This guide addresses the **`DATABASE_URL resolved to an empty string`** error and provides steps for a successful Railway deployment.

---

## 🛠️ The Fix: Setting the DATABASE_URL
The error in your logs is because Prisma cannot find the database connection string. In Railway, you must explicitly link your database to your service.

### 1. Provision PostgreSQL
If you haven't already:
1. Click **+ New** > **Database** > **Add PostgreSQL**.
2. Wait for it to initialize.

---

## 🚫 The Quote Problem (CRITICAL)
In your Railway Variables list, I see you have quotes around the values:
`DATABASE_URL="postgresql://..."`

**YOU MUST REMOVE THE QUOTES.** 
Railway adds quotes for display sometimes, but if you manually typed them into the box, it breaks the connection.
- **BAD**: `"postgresql://..."`
- **GOOD**: `postgresql://...` (No quotes at all!)

---

## 🛑 The Redis URL Correction
In the screenshots/logs you shared, your **`REDIS_URL`** is pointing to your **Postgres** database! This will cause the app to crash.

1.  Go to your **Redis service** (prodkb-redis) in Railway.
2.  In the **Connect** tab, copy the **Internal Redis URL**.
3.  Go back to **prodkb-backend** > **Variables**.
4.  Paste the **Redis URL** into the `REDIS_URL` variable.

---

## 💎 The Guaranteed Fix: Manual Connection String
If the `${{...}}` reference is failing, do this manually to guarantee it works:

1.  Go to your **PostgreSQL service** (prodkb-db) in Railway.
2.  Click the **Connect** tab.
3.  Copy the **Internal Database URL** (it starts with `postgresql://`).
4.  Go back to your **prodkb-backend** service > **Variables**.
5.  Edit `DATABASE_URL` and **PASTE the actual URL** (remove the `${{...}}` part entirely).
    - **Note**: DO NOT use quotes around it.
6.  Do the same for `REDIS_URL` using the **Internal Redis URL**.
7.  Click **Save**.

---

## 🔍 How to Verify in Railway Logs
Once you click **Save** on your variables, Railway will start a new "Deploy".
1. Look at the **Deploy Logs** (not Build Logs).
2. You should see:
   `Seeding database (NODE_ENV=production, SEED=true)...`
   `Starting ProdKB server...`
3. Then look for **Healthcheck Success**.

---

## ⚡ Step 3: Deployment Checklist

### A. Backend service
- **Root Directory**: `backend`
- **Build Command**: `npm run build`
- **Start Command**: `./start.sh`
- **Variables Needed**:
  - `DATABASE_URL`: (Linked from Postgres)
  - `REDIS_URL`: (Linked from Redis service)
  - `JWT_SECRET`: (Generate a random string)
  - `NODE_ENV`: `production`

### B. Frontend service
- **Root Directory**: `frontend`
- **Variables Needed**:
  - `VITE_API_URL`: (The URL of your Railway backend service)

---

## 🔍 How to Verify
Once the backend redeploys with the linked `DATABASE_URL`, look for these lines in the logs:
```text
Applying database migrations...
Migrations applied successfully.
Starting ProdKB server...
```
If you see those, the database connection is fixed!
