# ProdKB: Complete Architecture & Developer Playbook

## 1. 🏗️ SYSTEM OVERVIEW
**What it does:** ProdKB (Production Knowledge Base & Incident Management) is an enterprise-grade platform for engineering teams to log system incidents, define standard operating procedures (SOPs), enforce Service Level Agreements (SLAs), and coordinate automated responses. 

**Core Purpose & Business Logic:** 
To provide a single pane of glass for managing production outages. It bridges the gap between monitoring alerts and human resolution workflows by tracking incident lifecycles, dynamically routing tickets to teams based on severity, and escalating breaches in SLA constraints.

**Tech Stack Summary:**
- **Frontend:** React 18, Vite, TypeScript, TailwindCSS, React Router, React Hook Form, Zod.
- **Backend:** Node.js (v20), Express, TypeScript, Prisma ORM, BullMQ, `prom-client`.
- **Databases & Cache:** PostgreSQL 16 (via PgBouncer), Redis 7.
- **Object Storage:** MinIO (AWS S3 SDK compatible) for file uploads and incident attachments.
- **Observability & DevOps:** Prometheus, Grafana, Loki, Promtail (PLG Stack) orchestrated via Docker Compose.

---

## 2. 🗺️ ARCHITECTURE DIAGRAM

The system follows a decoupled monolithic structure containerized via Docker. The Node.js backend operates in a multi-core cluster to maximize CPU usage, backed by robust queueing for asynchronous tasks.

```mermaid
graph TD
    Client([Web Client / Browser])
    
    subgraph "Docker Bridge Network (prodkb-network)"
        UI[React Frontend SPA \n :8080]
        
        subgraph "Backend API (Node.js Cluster :3000)"
            LB[Primary Process \n Metrics Aggregator]
            Worker1[Express Worker 1]
            Worker2[Express Worker 2]
            LB --- Worker1
            LB --- Worker2
        end

        subgraph "Background Processing"
            SLAWorker[SLA & Webhook Worker \n Dedicated Process]
        end
        
        subgraph "Data Persistence Layer"
            PgBouncer[PgBouncer \n Connection Pooler :6432]
            DB[(PostgreSQL 16 \n :5432)]
            Redis[(Redis 7 \n Cache & PubSub :6379)]
            MinIO[(MinIO S3 \n Object Storage :9000)]
        end
        
        subgraph "Observability (PLG)"
            Prometheus[Prometheus]
            Grafana[Grafana Dashboards]
            Loki[Loki Logs]
            Promtail[Promtail Streams]
        end
    end

    Client -->|HTTPS| UI
    Client -->|REST API| LB
    
    Worker1 & Worker2 -->|SQL Queries| PgBouncer
    PgBouncer --> DB
    
    Worker1 & Worker2 -->|Sessions/Cache/BullMQ| Redis
    Redis -.->|BullMQ Events| SLAWorker
    SLAWorker --> PgBouncer
    
    Worker1 & Worker2 -->|Multipart Uploads| MinIO
    
    Prometheus -->|Scrape :3002/metrics| LB
    Promtail -.->|Tail JSON stdout| Worker1 & Worker2
    Promtail --> Loki
    Grafana --> Prometheus & Loki
```

---

## 3. 🔄 REQUEST LIFECYCLE (A → B Flow)

**Example Flow: A User Creates an Incident Ticket**

1. **User Action (Frontend):** The user submits the Incident creation form. `React Hook Form` validates the payload against a `Zod` schema.
2. **API Call:** An `axios` HTTP POST request is dispatched to `/api/v1/incidents` with the JWT Access Token in the Authorization header.
3. **Gateway & Auth (Backend):** 
   - Express receives the request (routed to an available child worker by the Node OS Cluster).
   - `helmet` secures headers; `express-rate-limit` checks Redis to ensure the IP isn't throttling.
   - `auth.middleware.ts` decodes the JWT and attaches the `User` object to the request context.
4. **Controller & Service Layer:** The `IncidentController` routes the DTO to `IncidentService.createIncident()`.
5. **Database Transaction:** Prisma executes an `INSERT` into PostgreSQL (routed through PgBouncer efficiently).
6. **Asynchronous Side-Effect:** The Service queues an `incident.created` event into BullMQ (stored in Redis) instead of waiting.
7. **Client Response:** HTTP 201 Created is returned to the user instantly.
8. **Background Execution:** The disconnected `SLAWorker` process pops the BullMQ job and fires external Webhooks/Emails alerting the assigned Team.

```mermaid
sequenceDiagram
    actor User
    participant Frontend as React SPA
    participant API as Node.js Express (Worker)
    participant Redis as Redis (BullMQ / Auth)
    participant DB as PostgreSQL (via PgBouncer)
    participant Worker as Background Node Worker
    participant Webhook as PagerDuty / Slack

    User->>Frontend: Click "Submit Incident"
    Frontend->>Frontend: Zod Schema Validation
    Frontend->>API: POST /api/v1/incidents (JWT)
    
    API->>Redis: Check Rate Limit & Session
    API->>DB: INSERT Incident (Prisma)
    DB-->>API: Incident ID
    
    API->>Redis: Enqueue Job (background_webhooks)
    API-->>Frontend: 201 Created (Fast Return)
    Frontend-->>User: Success Notification
    
    Note over Redis, Worker: Asynchronous Path
    Redis->>Worker: Dequeue Job Payload
    Worker->>Webhook: HTTP POST Alert Payload
    Webhook-->>Worker: 200 OK
```

---

## 4. 📁 PROJECT STRUCTURE BREAKDOWN

The monorepo separates concerns structurally:

```text
prodkb/
├── backend/                  # Node.js Express Core
│   ├── prisma/               # Database definitions & migrations
│   │   ├── schema.prisma     # Absolute source of truth for DB architecture
│   │   └── seed.ts           # Development seeding logic
│   ├── src/
│   │   ├── controllers/      # Route handlers mapping HTTP to Services
│   │   ├── services/         # Core business logic & Prisma queries
│   │   ├── common/           # Shared middlewares (Auth, Metrics, Err handling)
│   │   ├── workers/          # BullMQ background job consumers
│   │   ├── config/           # OpenAPI specs and environment loaders
│   │   └── server.ts         # Entry point (Clustering & AggregatorSetup)
│   └── Dockerfile            # Multi-stage Alpine container build
├── frontend/                 # React SPA
│   ├── src/
│   │   ├── components/       # Reusable Tailwind UI components
│   │   ├── pages/            # Routable macro-views (Dashboard, Incidents)
│   │   ├── services/         # Axios API wrapper classes
│   │   ├── hooks/            # Custom React hooks (Data fetching, Auth state)
│   │   ├── locales/          # i18next JSON translation files
│   │   └── App.tsx           # React Router definition
│   └── vite.config.ts        # Bundler configuration
└── docker-compose.yml        # Infrastructure definitions (DBs, PLG stack)
```

---

## 5. 🧩 COMPONENT MAP

| Module / Service | Responsibilities | Dependencies |
| :--- | :--- | :--- |
| **`IncidentService`** | Handles CRUD for tickets, calculates SLA deadlines based on Severity, triggers Auto-Assignment logic. | `PrismaClient`, `BullMQ`, `TeamService` |
| **`AuthService`** | JWT generation, bcrypt password hashing, HTTP-Only refresh cookie rotation. | `PrismaClient`, `Redis` (Token Revocation) |
| **`SLAWorker`** | Polls database periodically to identify tickets breaching resolution timers and increments escalation levels. | `PrismaClient`, `Node-Cron` |
| **`MetricsMiddleware`** | Collects CPU, Event Loop, and HTTP latency metrics. Exports via Node IPC to the Primary aggregator process. | `prom-client` |
| **`StorageService`** | Uploads and fetches buffer streams to S3/MinIO. Generates pre-signed URLs for frontend rendering. | `@aws-sdk/client-s3` |

---

## 6. 🗄️ DATA FLOW & DATABASE SCHEMA

**Data Movement:** 
The application acts as a typical REST API with a strict Data Access Object (DAO) pattern. 
Frontend `->` Controller `->` Service `->` Prisma ORM `->` PostgreSQL.

**Caching & State:**
- Redis is heavily utilized for **ephemeral state**: rate-limiting sliding windows, active JWT refresh token blacklists, and BullMQ execution locks.
- The PostgreSQL database remains the absolute source of truth for relational state.

**Core Entities (Simplified):**
1. **User / Role / Team:** Defines IAM identity and ownership.
2. **System / Job:** The infrastructure assets being monitored.
3. **Incident / SLA:** The outage event and its compliance constraints.
4. **Procedure:** The documentation/SOP linked to resolving an incident.

```mermaid
erDiagram
    User ||--o{ Incident : "Reports"
    Team ||--o{ Incident : "Assigned To"
    System ||--o{ Incident : "Affected Asset"
    
    SLA ||--|{ Incident : "Governs Timer"
    Incident ||--o{ IncidentLog : "Has multiple log events"
    
    EscalationRule }o--|| System : "Triggered by"
    Webhook }o--|| Incident : "Listens for updates"
```

---

## 7. 🔌 INTEGRATIONS & EXTERNAL SERVICES

1. **Authentication (JWT):** Custom asymmetrical JWT token implementation. Access tokens (15m expiry) live in memory/localStorage. Refresh tokens (7d) live in secure HTTP-Only cookies to protect against XSS.
2. **Webhooks (BullMQ):** External integrations (e.g., Slack, PagerDuty) are handled entirely via outbound webhooks. The Webhook engine features exponential backoff if the external service is down.
3. **AWS S3 / MinIO:** Files uploaded via the API are immediately pushed to an S3-compatible Blob store. PostegreSQL only stores the `bucket_key` and pre-signed URL paths.
4. **Email (SMTP):** Uses `nodemailer` attached to BullMQ to send asynchronous notification emails to Team distribution lists.

---

## 8. ⚙️ CONFIGURATION & ENVIRONMENT

The application relies entirely on `.env` files mapping into `process.env`. Docker Compose handles injecting these.

**Key Variables:**
- `DATABASE_URL`: Connection string. In production, this points to PgBouncer (`postgres://user:pass@pgbouncer:6432/db`).
- `REDIS_URL`: BullMQ and Rate Limiter target.
- `JWT_SECRET`: Hex key for signing tokens.
- `S3_ENDPOINT` & `S3_BUCKET`: Defines where to stream image uploads.
- `LOG_LEVEL`: Controls Winston outputs (`debug` vs `info`).

**Switching Environments:**
- Development runs via `npm run dev` (Node.js on Host, DB on Docker).
- Production uses multi-stage Docker builds. The `NODE_ENV=production` flag suppresses stack traces and triggers JSON-formatted Winston logs for Loki ingestion.

---

## 9. 🚀 DEPLOYMENT ARCHITECTURE

The platform is designed to be shipped as a multi-container Docker Swarm or Compose stack.

**Flow:**
1. **Build:** Backend (`node:20-alpine`) compiles TypeScript to JavaScript (`dist/`) and generates the Prisma schema binary.
2. **Images:** The frontend executes `vite build` into static assets (an Nginx container would typically serve these, or Vite's preview mode).
3. **Deployment:** `docker compose up -d` handles container orchestration. 
4. **Scaling:** The Node.js backend inherently scales to the host's CPU limits via `cluster.fork()`. Horizontal scaling is as simple as adding more backend replica containers behind an external Load Balancer (like Traefik or Nginx), sharing the same Redis and PgBouncer instances.

---

## 10. 🧭 DEVELOPER ONBOARDING PATH

How to go from zero to deploying a feature:

**Step 1: Environment Setup**
1. Install Docker Desktop, Node v20, and VS Code.
2. Clone the repository.
3. Run `docker compose up -d postgres redis minio` to spin up dependencies.

**Step 2: Database Initialization**
1. `cd backend`
2. `npm install`
3. `npx prisma migrate dev` (Builds tables)
4. `npx prisma db seed` (Populates dummy users, teams, and SLAs)

**Step 3: Run the Application**
1. Backend: `npm run dev` (Starts TS-Node on port 3000)
2. Frontend: `cd frontend && npm install && npm run dev` (Starts Vite on port 8080)

**Step 4: Making a Change (Example: Add a Field)**
1. **Schema:** Edit `backend/prisma/schema.prisma` -> run `npx prisma migrate dev --name add_field`.
2. **Backend:** Update the Zod Schema in the Controller, then update the Service logic to save the new field.
3. **Frontend:** Regenerate API types (`npm run api:types`), update the React Hook Form, and adjust the UI Component.
4. **Test:** Run `npm run test` in the backend to ensure Jest suites pass.

**Step 5: Deployment**
1. Commit changes. Run `docker compose build --no-cache backend` to rebuild the image locally, then `docker compose up -d` to restart the stack.

---

## 📋 Architecture Summary Card

| Domain | Specification | details |
| :--- | :--- | :--- |
| **Frontend** | React SPA | Vite, TailwindCSS, React Hook Form, Recharts, i18next |
| **Backend**| Express API | Node.js Clustering, BullMQ task delegation, Winston JSON logs |
| **Data Layer** | PostgreSQL + Prisma | PgBouncer for strict connection multiplexing |
| **File Storage** | MinIO (S3 SDK) | Secure, pre-signed URL asset distribution |
| **Observability**| PLG Stack | Prometheus/Grafana (metrics via IPC), Loki/Promtail (syslogs) |
| **Scalability** | CPU Forking | Zero-downtime worker replacement, Redis-backed queues |
| **Security** | JWT + Refresh | Defense-in-depth, strict CORS, HTTP-Only cookies, Rate Limiting |
