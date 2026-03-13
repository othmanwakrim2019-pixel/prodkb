# Architecture Refactor Blueprint

## Purpose

This document turns the current architecture audit into an execution plan for evolving ProdKB into a scalable modular monolith without rewriting the product from scratch.

The goal is to:

- keep the current stack and business behavior
- reduce coupling between UI, transport, business rules, and persistence
- make authorization and transactional logic safe by default
- let new features land in one place without editing five unrelated files

## Current Shape

The application already has good foundations:

- separate `frontend` and `backend` applications
- feature-oriented folders under `backend/src/modules`
- shared middleware, logging, metrics, queue workers, and OpenAPI setup
- reusable UI components and route guards on the frontend

The main issue is inconsistency. Some modules follow route -> controller -> service, while others do database and authorization work inline. Some frontend features use services, while others call `axios` directly from large page components.

## Architecture Direction

Use a modular monolith with layered feature slices.

This is the recommended target for the backend:

```text
backend/src/
  app/
    app.ts
    server.ts
    bootstrap/
  shared/
    auth/
    errors/
    logging/
    middleware/
    contracts/
    infrastructure/
  modules/
    incidents/
      presentation/
        incidents.routes.ts
        incidents.controller.ts
        incidents.schema.ts
        incidents.dto.ts
      application/
        use-cases/
        services/
        policies/
      domain/
        incident.entity.ts
        incident-status.ts
        incident.repository.ts
      infrastructure/
        prisma-incident.repository.ts
        incident.mapper.ts
    planning/
    roles/
    users/
    procedures/
    notifications/
```

This is the recommended target for the frontend:

```text
frontend/src/
  app/
    router/
    providers/
    layout/
  shared/
    ui/
    lib/
    hooks/
    types/
  features/
    auth/
      api/
      hooks/
      components/
    incidents/
      api/
      hooks/
      components/
      pages/
    planning/
      api/
      hooks/
      components/
      pages/
    admin/
      roles/
      users/
      systems/
      teams/
```

## Layer Responsibilities

### Backend

- `presentation`: Express routes, controllers, schemas, DTO translation
- `application`: use-cases and orchestration logic
- `domain`: policies, invariants, repository interfaces, domain rules
- `infrastructure`: Prisma repositories, gateways, adapters, mappers
- `shared`: cross-cutting concerns only

Rules:

- controllers do not query Prisma directly
- routes do not contain business logic
- transactional operations live in one use-case
- authorization checks are policy objects reused by REST and sockets

### Frontend

- `pages`: route-level composition only
- `components`: presentational or page-scoped UI pieces
- `hooks`: state and side-effects for a feature
- `api`: HTTP clients and response mapping for a feature
- `shared/ui`: reusable controls, dialogs, loaders, toasts
- `app/router`: route definitions and route metadata

Rules:

- pages do not call `axios` directly
- route metadata is defined once and reused for nav and guards
- permission checks come from one shared capability source
- alert/confirm/console error flows are replaced with shared UI feedback

## High-Risk Areas To Refactor First

### 1. Authorization

Target modules:

- `backend/src/modules/warroom/warroom.gateway.ts`
- `backend/src/common/middleware/auth.middleware.ts`
- `backend/src/modules/incidents/services/incident-visibility.service.ts`
- `frontend/src/App.tsx`
- `frontend/src/components/Layout.tsx`
- `frontend/src/pages/Admin.tsx`

Refactor direction:

- create an authorization policy layer for incident access
- reuse the same policy in REST routes, sockets, and background jobs
- centralize frontend route metadata: path, title, permission, nav visibility

Recommended pattern:

- Policy / Specification

### 2. Planning

Target modules:

- `backend/src/modules/planning/planning.service.ts`
- `backend/src/modules/planning/planning.controller.ts`
- `frontend/src/pages/planning/Planning.tsx`
- `frontend/src/pages/planning/PlanningTableView.tsx`
- `frontend/src/pages/planning/PlanningFlow.tsx`

Refactor direction:

- split planning instance use-cases from planning job use-cases
- isolate clone/import/status-transition operations into dedicated commands
- make clone/import fully transactional
- move frontend planning data access into `features/planning/api` and `features/planning/hooks`

Recommended patterns:

- Command / Use Case
- Repository

### 3. Roles and Admin

Target modules:

- `frontend/src/pages/RoleManager.tsx`
- `frontend/src/pages/admin/SystemManagement.tsx`
- `frontend/src/pages/admin/TeamManagement.tsx`
- `frontend/src/pages/admin/UserManagement.tsx`
- `frontend/src/services/admin.service.ts`

Refactor direction:

- split each admin area into its own feature folder
- keep page files thin and move API logic into feature API files
- introduce view models for forms and tables
- stop hardcoding route tabs and permission checks in multiple files

Recommended patterns:

- Presenter / View Model
- Feature API modules

### 4. Notifications and Infrastructure Services

Target modules:

- `backend/src/common/services/email.service.ts`
- `backend/src/common/services/file-upload.service.ts`
- `backend/src/modules/webhooks/*`

Refactor direction:

- separate transport concerns from content generation
- isolate template rendering from email delivery
- standardize adapters for S3, SMTP, Redis, and Socket.IO

Recommended patterns:

- Adapter
- Factory for channel payloads

## Concrete Refactor Rules

Apply these rules during all future work:

1. Any new backend feature must start in a module folder, not in `common`.
2. Any Prisma query with domain meaning must live behind a feature service or repository.
3. Any endpoint that changes multiple records must use one transaction use-case.
4. Any permission rule used in more than one place must become a policy helper.
5. Any new frontend route must be registered in one route metadata file.
6. Any new page over ~200 lines should be split before more behavior is added.
7. Any new feature API call must live outside the React component tree.

## Phase Plan

### Phase 1 - Stabilize The Edges

Goals:

- fix security and contract drift
- remove the most dangerous coupling

Tasks:

- remove the committed private key and rotate it
- add socket-level incident authorization in war room
- fix the planning route mismatch (`/incidents/create` vs `/incidents/new`)
- fix the stale admin permissions endpoint path in `frontend/src/services/admin.service.ts`
- standardize API response mapping in one place

Exit criteria:

- REST and socket access rules match
- no known broken route or endpoint contract mismatch remains

### Phase 2 - Split The Biggest God Objects

Goals:

- reduce file size and isolate transactional logic

Tasks:

- split `planning.service.ts` into instance use-cases and job use-cases
- split `incident.controller.ts` by read, write, file, and collaboration actions
- extract session warning UI from `AuthContext.tsx`
- split `Layout.tsx` into sidebar, topbar, and route metadata consumers

Exit criteria:

- no core application file above roughly 250-300 lines unless it is pure schema or generated code

### Phase 3 - Introduce Shared Metadata And Policies

Goals:

- remove duplicated strings and drift-prone configuration

Tasks:

- create shared permission constants for frontend consumption
- create route metadata with `path`, `permission`, `label`, `showInNav`, `adminTab`
- create backend authorization policies for incidents, roles, and admin access
- remove unused or duplicate abstractions like `permission.service.ts`

Exit criteria:

- adding a new page or permission touches one metadata definition, not multiple unrelated files

### Phase 4 - Build Test Coverage Around Architecture Boundaries

Goals:

- make refactoring safe

Tasks:

- backend integration tests for auth, role permissions, incident visibility, planning transitions, and war room access
- frontend tests for route metadata, permission-driven nav, and feature hooks
- keep Playwright for end-to-end happy paths only

Exit criteria:

- critical business rules are covered at backend integration level

## Suggested Module Templates

### Backend feature template

```text
modules/<feature>/
  presentation/
    <feature>.routes.ts
    <feature>.controller.ts
    <feature>.schema.ts
    <feature>.dto.ts
  application/
    use-cases/
    services/
    policies/
  domain/
    <feature>.repository.ts
    <feature>.types.ts
  infrastructure/
    prisma-<feature>.repository.ts
    <feature>.mapper.ts
```

### Frontend feature template

```text
features/<feature>/
  api/
    <feature>.api.ts
  hooks/
    use-<feature>.ts
  components/
  pages/
  model/
    <feature>.types.ts
    <feature>.mappers.ts
```

## Recommended Execution Order

1. Security and contract fixes
2. Authorization policy extraction
3. Planning backend split
4. Frontend route metadata centralization
5. Admin feature extraction
6. Test coverage around the new seams

## Definition Of Done For The Refactor

The architecture refactor is successful when:

- no critical security or authorization path bypass exists
- new features can be added within one feature folder
- route and permission metadata live in one source of truth
- large transactional operations are isolated and testable
- backend business rules are covered by integration tests
- frontend pages mostly compose hooks and components rather than owning transport logic
