4.  It will also automatically link all the variables (no manual typing needed!).

---

## 🚨 CRITICAL: Fix These Settings in Railway UI
If you see `npm error Missing script: "dev"`, it is because your Railway settings are overriding the defaults.

### 1. Set the "Root Directory" (CRITICAL FIX)
Because this project contains both a `backend` and a `frontend`, you must tell Railway which folder to build.
- Go to your service > **Settings** > **Source**.
- Find the **Root Directory** setting.
- Click **Add Root Directory** (or edit the existing one).
- Type **`/backend`** (for the backend service) or **`/frontend`** (for the frontend service).
- Press Enter/Save.

### 2. Clear the "Start Command"
- Go to your service (e.g., `prodkb-backend`) > **Settings** > **Deploy**.
- Empty the **Start Command** box (it should be blank) OR set it to **`npm start`**.
- **DO NOT** use `npm run dev`.

### 2. Fix the "Railway Config File"
- Go to **Settings** > **Config-as-code**.
- Ensure the **Railway config file path** is **EMPTY** or set to:
  - Backend: `backend/railway.json`
  - Frontend: `frontend/railway.json`
- **DO NOT** point it to `/template.json`. That file is for the *entire project*, not individual services.

---

---

## 🛠️ The Manual Fix: Setting the DATABASE_URL
If you already have a project and don't want to start over, follow these steps:

### 1. Provision PostgreSQL
If you haven't already:
1. Click **+ New** > **Database** > **Add PostgreSQL**.
2. Wait for it to initialize.

---

## Start Command Fix
4. **Force Init**: If for some reason migrations are stuck, you can add an environment variable `SEED=true` to the backend to force the initial data setup.
5. **Start Command Verification**: I have added a `"start": "..."` script to the `package.json` files. If Railway asks for a start command, it should now find it automatically.

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
