# Backend Modules Normalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Batch normalize backend modules in `backend/src/modules/` to align with the layered architecture (presentation, application, domain, infrastructure).

**Architecture:** Layered architecture.
- `presentation/`: Controllers, routes, and schemas (Express-specific).
- `application/`: Services (Business logic).
- `domain/`: Repository interfaces and domain models (Business rules).
- `infrastructure/`: Prisma repository implementations (Data access).

**Tech Stack:** TypeScript, Node.js, Express, Prisma, Jest.

---

### Task 1: Normalize 'users' module

**Files:**
- Create: `backend/src/modules/users/domain/user.repository.interface.ts`
- Create: `backend/src/modules/users/infrastructure/prisma-user.repository.ts`
- Move: `backend/src/modules/users/user.controller.ts` -> `backend/src/modules/users/presentation/user.controller.ts`
- Move: `backend/src/modules/users/user.routes.ts` -> `backend/src/modules/users/presentation/user.routes.ts`
- Move: `backend/src/modules/users/user.schema.ts` -> `backend/src/modules/users/presentation/user.schema.ts`
- Move: `backend/src/modules/users/user.service.ts` -> `backend/src/modules/users/application/user.service.ts`
- Modify: `backend/src/modules/v1.routes.ts`

- [ ] **Step 1: Define User Repository Interface in Domain**

```typescript
// backend/src/modules/users/domain/user.repository.interface.ts
import { Prisma } from '@prisma/client';

export interface IUserRepository {
    findAllUsers(): Promise<any[]>;
    findAllUsersDetailed(): Promise<any[]>;
    findUserById(id: string): Promise<any | null>;
    findRoleByName(name: string): Promise<any | null>;
    updateUser(id: string, data: Prisma.UserUncheckedUpdateInput): Promise<any>;
    findUserWithUsage(id: string): Promise<any | null>;
    deleteUser(id: string): Promise<any>;
    findUserCredentials(id: string): Promise<any | null>;
    updateUserPassword(id: string, password: string): Promise<any>;
    findUserWithPermissions(id: string): Promise<any | null>;
}
```

- [ ] **Step 2: Implement Prisma User Repository in Infrastructure**

```typescript
// backend/src/modules/users/infrastructure/prisma-user.repository.ts
import { Prisma } from '@prisma/client';
import { prisma } from '../../../common/utils/prisma';
import { IUserRepository } from '../domain/user.repository.interface';

const userRoleInclude = {
    role: { select: { id: true, name: true } },
} as const;

export class PrismaUserRepository implements IUserRepository {
    async findAllUsers() {
        return prisma.user.findMany({
            include: userRoleInclude,
            orderBy: { createdAt: 'desc' },
        });
    }

    async findAllUsersDetailed() {
        return prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: { select: { id: true, name: true } },
                isActive: true,
                createdAt: true,
                teamMemberships: {
                    select: {
                        role: true,
                        team: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findUserById(id: string) {
        return prisma.user.findUnique({
            where: { id },
            include: userRoleInclude,
        });
    }

    async findRoleByName(name: string) {
        return prisma.role.findUnique({ where: { name } });
    }

    async updateUser(id: string, data: Prisma.UserUncheckedUpdateInput) {
        return prisma.user.update({
            where: { id },
            data,
            include: userRoleInclude,
        });
    }

    async findUserWithUsage(id: string) {
        return prisma.user.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        createdIncidents: true,
                        teamMemberships: true,
                    },
                },
            },
        });
    }

    async deleteUser(id: string) {
        return prisma.user.delete({ where: { id } });
    }

    async findUserCredentials(id: string) {
        return prisma.user.findUnique({ where: { id } });
    }

    async updateUserPassword(id: string, password: string) {
        return prisma.user.update({
            where: { id },
            data: { password },
        });
    }

    async findUserWithPermissions(id: string) {
        return prisma.user.findUnique({
            where: { id },
            include: {
                role: {
                    include: {
                        permissions: { select: { code: true } },
                    },
                },
            },
        });
    }
}

export const userRepository = new PrismaUserRepository();
```

- [ ] **Step 3: Move files and update imports**
- Move `user.controller.ts`, `user.routes.ts`, `user.schema.ts` to `presentation/`.
- Move `user.service.ts` to `application/`.
- Update `user.service.ts` to import `userRepository` from `../infrastructure/prisma-user.repository`.
- Update `user.controller.ts` to import `userService` from `../application/user.service` and schemas from `./user.schema`.
- Update `user.routes.ts` to import `userController` from `./user.controller`.
- Delete `backend/src/modules/users/repositories` directory.

- [ ] **Step 4: Update `backend/src/modules/v1.routes.ts`**
- Change `import { userRoutes } from './users/user.routes';` to `import { userRoutes } from './users/presentation/user.routes';`.

- [ ] **Step 5: Run tests and verify**
- Run: `npm test backend/tests/UserService.test.ts`
- Expected: PASS

---

### Task 2: Normalize 'roles' module

**Files:**
- Create: `backend/src/modules/roles/domain/role.repository.interface.ts`
- Create: `backend/src/modules/roles/infrastructure/prisma-role.repository.ts`
- Move: `backend/src/modules/roles/role.controller.ts` -> `backend/src/modules/roles/presentation/role.controller.ts`
- Move: `backend/src/modules/roles/role.routes.ts` -> `backend/src/modules/roles/presentation/role.routes.ts`
- Move: `backend/src/modules/roles/role.schema.ts` -> `backend/src/modules/roles/presentation/role.schema.ts`
- Move: `backend/src/modules/roles/role.service.ts` -> `backend/src/modules/roles/application/role.service.ts`
- Modify: `backend/src/modules/v1.routes.ts`

- [ ] **Step 1: Define Interface and Implementation for Role Repository**
- [ ] **Step 2: Move files and update imports**
- [ ] **Step 3: Update `backend/src/modules/v1.routes.ts`**
- [ ] **Step 4: Run tests and verify**
- Run: `npm test backend/tests/RoleService.test.ts`
- Expected: PASS

---

### Task 3: Normalize 'teams' module

- [ ] **Step 1: Define Interface and Implementation for Team Repository**
- [ ] **Step 2: Move files and update imports**
- [ ] **Step 3: Update `backend/src/modules/v1.routes.ts`**
- [ ] **Step 4: Run tests and verify**
- Run: `npm test backend/tests/EquipePlanService.test.ts` (or relevant team tests)

---

### Task 4: Normalize 'systems' module

- [ ] **Step 1: Define Interface and Implementation for System Repository**
- [ ] **Step 2: Move files and update imports**
- [ ] **Step 3: Update `backend/src/modules/v1.routes.ts`**
- [ ] **Step 4: Run tests and verify**

---

### Task 5: Normalize 'sla' module

- [ ] **Step 1: Define Interface and Implementation for SLA Repository**
- [ ] **Step 2: Move files and update imports**
- [ ] **Step 3: Update `backend/src/modules/v1.routes.ts`**
- [ ] **Step 4: Run tests and verify**
- Run: `npm test backend/tests/sla-enforcement.test.ts`

---

### Task 6: Normalize remaining modules

Modules: 'escalation', 'auto-assign', 'webhooks', 'email-templates', 'audit', 'search', 'notifications', 'postmortem', 'maintenance', 'warroom', 'astreinte', 'config', 'status', 'events', 'procedures'.

- [ ] **Step 1: Repeat the normalization pattern for each remaining module.**

---

### Task 7: Final Cleanup and Global Verification

- [ ] **Step 1: Run full backend test suite**
- Run: `cd backend && npm test`
- [ ] **Step 2: Run build to check for compilation errors**
- Run: `cd backend && npm run build`
- [ ] **Step 3: Verify all legacy files are removed**
