> [!WARNING]
> **DEPRECATED — Historical planning document.** The backend architecture normalization described here is complete. Do not treat this as current guidance. The authoritative architecture contract is [ARCHITECTURE.md](ARCHITECTURE.md). The execution roadmap is [architecture-migration-roadmap.md](architecture-migration-roadmap.md).

# Backend Architecture Implementation Plan

## Goal

Standardize the backend around one modular layered architecture so every module follows the same system design, stays readable, and scales without growing route-level business logic or oversized controllers.

This plan is based on the current backend under [backend/src](/C:/Users/a933556/.gemini/antigravity/scratch/prodkb/backend/src).

## Current Backend State

The backend already has a solid modular-monolith base:

- shared cross-cutting code lives in `common/`, `config/`, `constants/`, and `types/`
- feature code is split under `modules/`
- many modules already follow `routes -> controller -> service`
- shared auth extraction has already started:
  - [auth.middleware.ts](/C:/Users/a933556/.gemini/antigravity/scratch/prodkb/backend/src/common/middleware/auth.middleware.ts)
  - [auth-context.service.ts](/C:/Users/a933556/.gemini/antigravity/scratch/prodkb/backend/src/common/auth/auth-context.service.ts)
  - [authorization.policy.ts](/C:/Users/a933556/.gemini/antigravity/scratch/prodkb/backend/src/common/auth/authorization.policy.ts)

The backend problem is not "no architecture".
The real issue is architectural inconsistency.

Some modules are layered. Others still keep logic inline in routes. Others have controllers or services that are too broad and act like mini application layers.

## Inventory

- `129` backend source files under [backend/src](/C:/Users/a933556/.gemini/antigravity/scratch/prodkb/backend/src)

Current modules:

- `analytics`
- `audit`
- `auth`
- `auto-assign`
- `config`
- `email-templates`
- `escalation`
- `events`
- `incidents`
- `maintenance`
- `notifications`
- `planning`
- `postmortem`
- `procedures`
- `roles`
- `search`
- `sla`
- `status`
- `systems`
- `teams`
- `users`
- `warroom`
- `webhooks`

## Architecture Audit

### Modules that already follow the target direction reasonably well

These already mostly follow `routes -> controller -> service`:

- `audit`
- `auth`
- `config`
- `email-templates`
- `maintenance`
- `notifications`
- `procedures`
- `roles`
- `systems`
- `teams`
- `users`

These are not perfect, but they already have a recognizable module shape.

### Modules with a good base but oversized responsibilities

- `incidents`
  - [incident.controller.ts](/C:/Users/a933556/.gemini/antigravity/scratch/prodkb/backend/src/modules/incidents/incident.controller.ts)
  - good service split already exists under [services](/C:/Users/a933556/.gemini/antigravity/scratch/prodkb/backend/src/modules/incidents/services)
  - problem: the controller still mixes queries, commands, file streaming, validation coordination, and access handling

- `planning`
  - [planning.controller.ts](/C:/Users/a933556/.gemini/antigravity/scratch/prodkb/backend/src/modules/planning/planning.controller.ts)
  - application split already started:
    - [planning-instance.service.ts](/C:/Users/a933556/.gemini/antigravity/scratch/prodkb/backend/src/modules/planning/application/planning-instance.service.ts)
    - [planning-job.service.ts](/C:/Users/a933556/.gemini/antigravity/scratch/prodkb/backend/src/modules/planning/application/planning-job.service.ts)
  - problem: the controller is still too broad

- `systems`
  - [system.controller.ts](/C:/Users/a933556/.gemini/antigravity/scratch/prodkb/backend/src/modules/systems/system.controller.ts)
  - [system.service.ts](/C:/Users/a933556/.gemini/antigravity/scratch/prodkb/backend/src/modules/systems/system.service.ts)
  - [health-score.service.ts](/C:/Users/a933556/.gemini/antigravity/scratch/prodkb/backend/src/modules/systems/health-score.service.ts)
  - problem: structurally acceptable, but still service-heavy

### Modules that do not fully respect the same architecture

These still skip controller boundaries or keep route handlers inline:

- `analytics`
  - [analytics.routes.ts](/C:/Users/a933556/.gemini/antigravity/scratch/prodkb/backend/src/modules/analytics/analytics.routes.ts)
  - no controller

- `auto-assign`
  - [auto-assign.routes.ts](/C:/Users/a933556/.gemini/antigravity/scratch/prodkb/backend/src/modules/auto-assign/auto-assign.routes.ts)
  - no controller

- `escalation`
  - [escalation.routes.ts](/C:/Users/a933556/.gemini/antigravity/scratch/prodkb/backend/src/modules/escalation/escalation.routes.ts)
  - no controller

- `status`
  - [status.routes.ts](/C:/Users/a933556/.gemini/antigravity/scratch/prodkb/backend/src/modules/status/status.routes.ts)
  - no controller

- `postmortem`
  - [postmortem.routes.ts](/C:/Users/a933556/.gemini/antigravity/scratch/prodkb/backend/src/modules/postmortem/postmortem.routes.ts)
  - no controller
  - no service

- `warroom`
  - [warroom.routes.ts](/C:/Users/a933556/.gemini/antigravity/scratch/prodkb/backend/src/modules/warroom/warroom.routes.ts)
  - has service, but no controller

- `webhooks`
  - [webhook.routes.ts](/C:/Users/a933556/.gemini/antigravity/scratch/prodkb/backend/src/modules/webhooks/webhook.routes.ts)
  - no controller

This is the clearest sign that the backend architecture is only partially normalized.

## Main Problems

### 1. Uneven module boundaries

Different modules currently use different patterns:

- `routes -> controller -> service`
- `routes -> service`
- `routes -> inline business logic`

That makes the codebase harder to learn and harder to evolve consistently.

### 2. Oversized controllers

These are still too broad:

- [incident.controller.ts](/C:/Users/a933556/.gemini/antigravity/scratch/prodkb/backend/src/modules/incidents/incident.controller.ts)
- [planning.controller.ts](/C:/Users/a933556/.gemini/antigravity/scratch/prodkb/backend/src/modules/planning/planning.controller.ts)
- [system.controller.ts](/C:/Users/a933556/.gemini/antigravity/scratch/prodkb/backend/src/modules/systems/system.controller.ts)

This violates single responsibility and leads to "god files".

### 3. Oversized services

Several services still mix:

- orchestration
- persistence
- validation coordination
- aggregation
- business rules

Examples:

- [planning-instance.service.ts](/C:/Users/a933556/.gemini/antigravity/scratch/prodkb/backend/src/modules/planning/application/planning-instance.service.ts)
- [planning-job.service.ts](/C:/Users/a933556/.gemini/antigravity/scratch/prodkb/backend/src/modules/planning/application/planning-job.service.ts)
- [incident-crud.service.ts](/C:/Users/a933556/.gemini/antigravity/scratch/prodkb/backend/src/modules/incidents/services/incident-crud.service.ts)
- [team.service.ts](/C:/Users/a933556/.gemini/antigravity/scratch/prodkb/backend/src/modules/teams/team.service.ts)
- [auth.service.ts](/C:/Users/a933556/.gemini/antigravity/scratch/prodkb/backend/src/modules/auth/auth.service.ts)

### 4. Missing persistence boundaries for high-complexity modules

Most services call Prisma directly.

That is acceptable for simple CRUD modules, but it becomes noisy in high-complexity modules like:

- `incidents`
- `planning`
- `teams`
- `systems`

These modules should gain internal repository or persistence-adapter seams first.

### 5. Business authorization is not yet fully standardized

Transport-level authentication is improving, but business access rules are still distributed between:

- middleware
- routes
- controllers
- gateways
- services

The target should be:

- middleware/gateway: transport auth only
- application layer: business authorization decisions

## Recommended Target Architecture

Use one backend pattern for every module:

```text
backend/src/
  app/
    app.ts
    server.ts
  common/
    auth/
    errors/
    middleware/
    services/
    types/
    utils/
  config/
  constants/
  modules/
    <module>/
      presentation/
        <module>.routes.ts
        <module>.controller.ts
        <module>.schema.ts
      application/
        services/
        policies/
        use-cases/
      infrastructure/
        repositories/
        prisma/
        gateways/
      domain/
        rules/
        types/
```

This is not a demand to create every folder for every module immediately.
It is the target shape and naming contract.

## Mandatory Rules

### Routes

Routes may:

- define endpoints
- attach middleware
- attach controller handlers

Routes may not:

- call Prisma directly
- contain inline business handlers
- duplicate multi-step business logic

### Controllers

Controllers may:

- read request input
- call application services
- map responses to HTTP

Controllers may not:

- own long workflows
- own direct persistence logic
- become large mixed-responsibility files

### Application services

Application services should:

- own business workflows
- combine policies, repositories, and external services
- stay independent from Express

### Infrastructure

Infrastructure should contain:

- Prisma access
- Redis access
- queue integration
- email/webhook/socket adapters

### Repositories

Do not create repository wrappers for every Prisma call.
Introduce them where complexity justifies them:

- `incidents`
- `planning`
- `teams`
- `systems`

## Migration Order

### Phase 1. Normalize modules missing controller boundaries

Create controllers for:

- `analytics`
- `status`
- `warroom`
- `postmortem`
- `webhooks`
- `auto-assign`
- `escalation`

Why first:

- small surface area
- high architectural value
- low behavior risk

### Phase 2. Split oversized controllers

Refactor:

- `incidents`
  - query controller
  - command controller
  - file controller
- `planning`
  - instance controller
  - job controller
  - import controller
- `systems`
  - split health concerns from CRUD concerns

### Phase 3. Add persistence seams to high-complexity modules

Introduce repository or adapter boundaries for:

- `incidents`
- `planning`
- `teams`
- `systems`

### Phase 4. Normalize the simpler CRUD modules

Align naming and folder placement for:

- `users`
- `roles`
- `teams`
- `email-templates`
- `config`
- `maintenance`
- `notifications`

### Phase 5. Strengthen shared backend contracts

Centralize:

- response contracts
- authorization policy entry points
- audit logging orchestration
- multi-step transaction helpers

### Phase 6. Add backend test coverage by module seam

Prioritize tests for:

- auth flows
- permission middleware
- incident access policies
- planning clone/import
- role permission replacement
- war room access
- postmortem access

## Module Classification

### Lower priority

- `audit`
- `config`
- `email-templates`
- `maintenance`
- `notifications`
- `procedures`
- `roles`
- `users`

### Medium priority

- `auth`
- `systems`
- `teams`
- `sla`

### Highest architecture priority

- `analytics`
- `auto-assign`
- `escalation`
- `incidents`
- `planning`
- `postmortem`
- `status`
- `warroom`
- `webhooks`

## Definition of Done

The backend architecture should be considered clean when:

- every module follows the same presentation/application split
- no route file contains inline business handlers
- no controller is a "god file"
- complex Prisma access is isolated away from controllers
- authorization rules are reusable and explicit
- new features can be added inside one module without editing many unrelated files
- high-risk workflows are covered by tests

## Immediate Next Backend Work

If we continue after review, the best next order is:

1. normalize missing-controller modules:
   - `analytics`
   - `status`
   - `warroom`
   - `postmortem`
   - `webhooks`
   - `auto-assign`
   - `escalation`
2. split [incident.controller.ts](/C:/Users/a933556/.gemini/antigravity/scratch/prodkb/backend/src/modules/incidents/incident.controller.ts)
3. split [planning.controller.ts](/C:/Users/a933556/.gemini/antigravity/scratch/prodkb/backend/src/modules/planning/planning.controller.ts)
4. add repository-style persistence seams for `incidents` and `planning`
5. add backend integration tests around the normalized seams

## Important Constraint

This plan is intentionally incremental.

Do not rebuild the backend from scratch.
Do not move every file at once.
Normalize one module or one seam at a time while keeping behavior stable and `npm run typecheck` green after each slice.
