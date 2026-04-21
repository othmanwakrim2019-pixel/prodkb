# Normalize Backend Modules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Normalize 'escalation', 'events', and 'maintenance' modules to layered architecture.

**Architecture:** Presentation (Routes/Controllers), Application (Services), Domain (Interfaces), Infrastructure (Repositories/Prisma).

**Tech Stack:** TypeScript, Express, Prisma, Redis.

---

### Task 1: Normalize 'escalation' module

**Files:**
- Create: `backend/src/modules/escalation/domain/escalation.repository.interface.ts`
- Modify: `backend/src/modules/escalation/infrastructure/escalation.repository.ts` (moved from `repositories/`)
- Modify: `backend/src/modules/escalation/application/escalation.service.ts`
- Modify: `backend/src/modules/escalation/presentation/escalation.routes.ts`
- Modify: `backend/src/modules/v1.routes.ts`

- [ ] **Step 1: Move repository and extract interface**

Move `backend/src/modules/escalation/repositories/escalation.repository.ts` to `backend/src/modules/escalation/infrastructure/escalation.repository.ts`.

Create `backend/src/modules/escalation/domain/escalation.repository.interface.ts`:
```typescript
import { z } from 'zod';
import { createEscalationRuleSchema, updateEscalationRuleSchema } from '../presentation/escalation.schema';

export interface IEscalationRepository {
    findRules(): Promise<any[]>;
    findRuleById(id: string): Promise<any | null>;
    createRule(data: z.infer<typeof createEscalationRuleSchema>): Promise<any>;
    updateRule(id: string, data: z.infer<typeof updateEscalationRuleSchema>): Promise<any>;
    deleteRule(id: string): Promise<any>;
    findIncidentForEscalation(incidentId: string): Promise<any | null>;
    findNextEscalationRule(systemId: string, severity: string, level: number): Promise<any | null>;
    escalateIncident(incidentId: string, teamId: string, level: number): Promise<void>;
    createIncidentLog(incidentId: string, message: string): Promise<void>;
}
```

- [ ] **Step 2: Update repository implementation**

Modify `backend/src/modules/escalation/infrastructure/escalation.repository.ts` to implement the interface.

- [ ] **Step 3: Update escalation.service.ts**

Fix imports and use the interface.
```typescript
import { IEscalationRepository } from '../domain/escalation.repository.interface';
import { escalationRepository } from '../infrastructure/escalation.repository';
// ...
```

- [ ] **Step 4: Update v1.routes.ts and escalation.routes.ts**

Update `backend/src/modules/v1.routes.ts` to import `escalationRoutes` from `./escalation/presentation/escalation.routes`.

- [ ] **Step 5: Cleanup**

Delete `backend/src/modules/escalation/repositories` directory.

---

### Task 2: Normalize 'events' module

**Files:**
- Create: `backend/src/modules/events/presentation/`
- Create: `backend/src/modules/events/application/`
- Modify: `backend/src/modules/events/presentation/events.routes.ts`
- Modify: `backend/src/modules/events/presentation/sse.controller.ts`
- Modify: `backend/src/modules/events/application/event.publisher.ts`
- Modify: `backend/src/app.ts`

- [ ] **Step 1: Create directories**

`mkdir -p backend/src/modules/events/presentation backend/src/modules/events/application backend/src/modules/events/domain backend/src/modules/events/infrastructure`

- [ ] **Step 2: Move files**

Move `events.routes.ts` and `sse.controller.ts` to `presentation/`.
Move `event.publisher.ts` to `application/`.

- [ ] **Step 3: Update imports in moved files**

Fix relative imports in `events.routes.ts`, `sse.controller.ts`, and `event.publisher.ts`.

- [ ] **Step 4: Update app.ts**

Update `backend/src/app.ts` to import `eventRoutes` from `./modules/events/presentation/events.routes`.

---

### Task 3: Normalize 'maintenance' module

**Files:**
- Create: `backend/src/modules/maintenance/presentation/`
- Create: `backend/src/modules/maintenance/application/`
- Create: `backend/src/modules/maintenance/domain/`
- Create: `backend/src/modules/maintenance/infrastructure/`
- Modify: `backend/src/modules/maintenance/presentation/maintenance.routes.ts`
- Modify: `backend/src/modules/maintenance/presentation/maintenance.controller.ts`
- Modify: `backend/src/modules/maintenance/application/maintenance.service.ts`
- Modify: `backend/src/modules/maintenance/infrastructure/maintenance.repository.ts`
- Modify: `backend/src/modules/v1.routes.ts`

- [ ] **Step 1: Create directories**

`mkdir -p backend/src/modules/maintenance/presentation backend/src/modules/maintenance/application backend/src/modules/maintenance/domain backend/src/modules/maintenance/infrastructure`

- [ ] **Step 2: Move files**

Move `maintenance.routes.ts` and `maintenance.controller.ts` to `presentation/`.
Move `maintenance.service.ts` to `application/`.
Move `repositories/maintenance.repository.ts` to `infrastructure/`.

- [ ] **Step 3: Extract interface**

Create `backend/src/modules/maintenance/domain/maintenance.repository.interface.ts`.

- [ ] **Step 4: Update implementation and service**

Update `maintenance.repository.ts` and `maintenance.service.ts` with new paths and interface usage.

- [ ] **Step 5: Update v1.routes.ts**

Update `backend/src/modules/v1.routes.ts` to import `maintenanceRoutes` from `./maintenance/presentation/maintenance.routes`.

- [ ] **Step 6: Cleanup**

Delete `backend/src/modules/maintenance/repositories` and any other legacy files in the root of the module.
