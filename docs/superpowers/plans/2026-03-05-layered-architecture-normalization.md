# Layered Architecture Normalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Normalize `auto-assign`, `config`, `email-templates`, and `escalation` backend modules to a layered architecture.

**Architecture:** Layered Architecture (Presentation, Application, Domain, Infrastructure).
- `presentation/`: routes, controllers, and schemas.
- `application/`: services.
- `domain/`: repository interfaces.
- `infrastructure/`: Prisma implementations (if a repository exists).

**Tech Stack:** TypeScript, Node.js, Express, Prisma, Zod.

---

### Task 1: Refactor 'auto-assign' Module

**Files:**
- Create: `backend/src/modules/auto-assign/presentation/`
- Create: `backend/src/modules/auto-assign/application/`
- Create: `backend/src/modules/auto-assign/domain/`
- Create: `backend/src/modules/auto-assign/infrastructure/`
- Move/Create: `backend/src/modules/auto-assign/presentation/auto-assign.controller.ts`
- Move/Create: `backend/src/modules/auto-assign/presentation/auto-assign.routes.ts`
- Move/Create: `backend/src/modules/auto-assign/presentation/auto-assign.schema.ts`
- Move/Create: `backend/src/modules/auto-assign/application/auto-assign.service.ts`
- Create: `backend/src/modules/auto-assign/domain/auto-assign.repository.interface.ts`
- Create: `backend/src/modules/auto-assign/infrastructure/prisma-auto-assign.repository.ts`

- [ ] **Step 1: Create directories**
Run: `mkdir backend/src/modules/auto-assign/presentation backend/src/modules/auto-assign/application backend/src/modules/auto-assign/domain backend/src/modules/auto-assign/infrastructure`

- [ ] **Step 2: Extract repository interface**
Create `backend/src/modules/auto-assign/domain/auto-assign.repository.interface.ts` based on `backend/src/modules/auto-assign/repositories/auto-assign.repository.ts`.

- [ ] **Step 3: Create Prisma implementation**
Create `backend/src/modules/auto-assign/infrastructure/prisma-auto-assign.repository.ts` implementing the interface.

- [ ] **Step 4: Move and update service**
Move `backend/src/modules/auto-assign/auto-assign.service.ts` to `backend/src/modules/auto-assign/application/` and update imports.

- [ ] **Step 5: Move and update controller, routes, schema**
Move files to `presentation/` and update internal and external imports.

- [ ] **Step 6: Update `backend/src/modules/v1.routes.ts`**
Update the route import for `auto-assign`.

- [ ] **Step 7: Clean up legacy files**
Delete `backend/src/modules/auto-assign/repositories/` and old files.

---

### Task 2: Refactor 'escalation' Module

**Files:**
- Create: `backend/src/modules/escalation/presentation/`
- Create: `backend/src/modules/escalation/application/`
- Create: `backend/src/modules/escalation/domain/`
- Create: `backend/src/modules/escalation/infrastructure/`
- Move: `backend/src/modules/escalation/presentation/escalation.controller.ts`
- Move: `backend/src/modules/escalation/presentation/escalation.routes.ts`
- Move: `backend/src/modules/escalation/presentation/escalation.schema.ts`
- Move: `backend/src/modules/escalation/application/escalation.service.ts`
- Create: `backend/src/modules/escalation/domain/escalation.repository.interface.ts`
- Create: `backend/src/modules/escalation/infrastructure/prisma-escalation.repository.ts`

- [ ] **Step 1: Create directories**
Run: `mkdir backend/src/modules/escalation/presentation backend/src/modules/escalation/application backend/src/modules/escalation/domain backend/src/modules/escalation/infrastructure`

- [ ] **Step 2: Extract repository interface**
Create `backend/src/modules/escalation/domain/escalation.repository.interface.ts`.

- [ ] **Step 3: Create Prisma implementation**
Create `backend/src/modules/escalation/infrastructure/prisma-escalation.repository.ts`.

- [ ] **Step 4: Move and update service**
Move `backend/src/modules/escalation/escalation.service.ts` to `backend/src/modules/escalation/application/`.

- [ ] **Step 5: Move and update controller, routes, schema**
Move to `presentation/`.

- [ ] **Step 6: Update `backend/src/modules/v1.routes.ts`**

- [ ] **Step 7: Clean up legacy files**

---

### Task 3: Refactor 'config' Module

**Files:**
- Create: `backend/src/modules/config/presentation/`
- Create: `backend/src/modules/config/application/`
- Move: `backend/src/modules/config/presentation/config.controller.ts`
- Move: `backend/src/modules/config/presentation/config.routes.ts`
- Move: `backend/src/modules/config/application/config.service.ts`

- [ ] **Step 1: Create directories**
Run: `mkdir backend/src/modules/config/presentation backend/src/modules/config/application`

- [ ] **Step 2: Move and update service**
Move `backend/src/modules/config/config.service.ts` to `backend/src/modules/config/application/`.

- [ ] **Step 3: Move and update controller and routes**
Move to `presentation/`.

- [ ] **Step 4: Update `backend/src/modules/v1.routes.ts`**

- [ ] **Step 5: Clean up old files**

---

### Task 4: Refactor 'email-templates' Module

**Files:**
- Create: `backend/src/modules/email-templates/presentation/`
- Create: `backend/src/modules/email-templates/application/`
- Move: `backend/src/modules/email-templates/presentation/email-template.controller.ts`
- Move: `backend/src/modules/email-templates/presentation/email-template.routes.ts`
- Move: `backend/src/modules/email-templates/presentation/email-template.schema.ts`
- Move: `backend/src/modules/email-templates/application/email-template.service.ts`

- [ ] **Step 1: Create directories**
Run: `mkdir backend/src/modules/email-templates/presentation backend/src/modules/email-templates/application`

- [ ] **Step 2: Move and update service**
Move `backend/src/modules/email-templates/email-template.service.ts` to `backend/src/modules/email-templates/application/`.

- [ ] **Step 3: Move and update controller, routes, schema**
Move to `presentation/`.

- [ ] **Step 4: Update `backend/src/modules/v1.routes.ts`**

- [ ] **Step 5: Clean up old files**

---

### Task 5: Global Verification

- [ ] **Step 1: Check all imports**
Ensure no broken imports in other modules (e.g., `analytics`, `incidents`) that might depend on these services.

- [ ] **Step 2: Run build**
Run: `npm run build` in backend.

- [ ] **Step 3: Run tests**
Run: `npm test` in backend.
