# Architecture Migration Roadmap

## Purpose

This roadmap turns the architecture contract into an execution sequence for the current ProdKB codebase.

The rule is simple:

- every next refactor must move one feature closer to the architecture contract
- do not refactor randomly
- do not mix different architectural styles inside the same feature unless it is a temporary migration step

## Current Migration Status

### Already started

- shared frontend route metadata has been introduced
- shared backend authorization policy helpers have been introduced
- shared backend auth hydration and cache context has been introduced
- war room socket authorization now reuses backend authorization rules

### Still legacy-heavy

- backend planning module
- backend incidents controller
- frontend planning feature
- frontend admin feature pages
- frontend auth context

## Migration Order

## Milestone 1 - Architecture Guardrails

Goal:

- make the target architecture explicit and enforceable

Deliverables:

- `docs/ARCHITECTURE.md`
- `docs/architecture-refactor-blueprint.md`
- this roadmap document

Done when:

- future work can reference one architecture contract

## Milestone 2 - Shared Auth and Access Rules

Goal:

- unify the most dangerous cross-cutting logic

Scope:

- `backend/src/common/middleware/auth.middleware.ts`
- `backend/src/common/auth/*`
- `backend/src/modules/incidents/services/incident-visibility.service.ts`
- `backend/src/modules/warroom/warroom.gateway.ts`

Tasks:

- centralize permission checks
- centralize role checks
- centralize auth user hydration
- centralize auth cache behavior
- ensure sockets and REST use the same access rules

Status:

- in progress

Next remaining work:

- extract token parsing and request user bootstrap helpers out of middleware
- add backend integration tests for auth and war room access

## Milestone 3 - Frontend Routing and Navigation Consistency

Goal:

- stop duplicating path and permission metadata

Scope:

- `frontend/src/App.tsx`
- `frontend/src/components/Layout.tsx`
- `frontend/src/pages/Admin.tsx`
- `frontend/src/app/route-meta.ts`

Tasks:

- define shared app paths
- define top-level nav metadata
- define admin tab metadata
- make router, sidebar, and admin tab logic consume the same source

Status:

- started

Next remaining work:

- add route metadata tests
- move any remaining path strings to shared constants

## Milestone 4 - Backend Planning Module Normalization

Goal:

- make planning the reference feature for backend layered architecture

Scope:

- `backend/src/modules/planning/planning.controller.ts`
- `backend/src/modules/planning/planning.service.ts`
- `backend/src/modules/planning/planning.routes.ts`

Target structure:

```text
modules/planning/
  presentation/
  application/
    use-cases/
    services/
  domain/
    planning.repository.ts
    planning.rules.ts
  infrastructure/
    prisma-planning.repository.ts
```

Tasks:

- split instance workflows from job workflows
- move clone/import into dedicated use-cases
- keep transitions in explicit rule helpers
- reduce file size and mixed responsibilities

Priority:

- high

## Milestone 5 - Frontend Planning Feature Normalization

Goal:

- make planning the reference feature for frontend feature layering

Scope:

- `frontend/src/pages/planning/Planning.tsx`
- `frontend/src/pages/planning/PlanningTableView.tsx`
- `frontend/src/pages/planning/PlanningFlow.tsx`
- `frontend/src/pages/planning/*Modal.tsx`

Target structure:

```text
features/planning/
  api/
  hooks/
  components/
  pages/
  model/
```

Tasks:

- extract API calls into feature API
- extract orchestration state into hooks
- keep route page focused on composition
- split view-mode and modal concerns into clear components

Priority:

- high

## Milestone 6 - Incidents Backend Normalization

Goal:

- split the incident controller into clear layers and use-cases

Scope:

- `backend/src/modules/incidents/incident.controller.ts`
- `backend/src/modules/incidents/services/incident-crud.service.ts`
- `backend/src/modules/incidents/services/incident-analytics.service.ts`

Tasks:

- separate read actions from write actions
- separate file actions from collaboration actions
- move business workflows into use-cases
- keep incident visibility policy reused

Priority:

- high

## Milestone 7 - Admin Frontend Normalization

Goal:

- make admin pages follow one predictable feature structure

Scope:

- `frontend/src/pages/RoleManager.tsx`
- `frontend/src/pages/admin/SystemManagement.tsx`
- `frontend/src/pages/admin/TeamManagement.tsx`
- `frontend/src/pages/admin/UserManagement.tsx`
- `frontend/src/services/admin.service.ts`

Tasks:

- split each admin area into feature folders
- replace page-owned transport logic with feature APIs and hooks
- move confirmation and error feedback to shared UI flows
- reduce file size and repeated table/form patterns

Priority:

- medium-high

## Milestone 8 - Auth Frontend Normalization

Goal:

- make auth context smaller and more focused

Scope:

- `frontend/src/context/AuthContext.tsx`
- `frontend/src/components/ProtectedRoute.tsx`
- `frontend/src/components/CanAccess.tsx`

Tasks:

- keep session state in auth provider
- move session timeout UI into dedicated auth components
- keep permission helpers small and reusable

Priority:

- medium

## Milestone 9 - Infrastructure Service Cleanup

Goal:

- reduce shared-service god files

Scope:

- `backend/src/common/services/email.service.ts`
- `backend/src/common/services/file-upload.service.ts`

Tasks:

- split content builders from delivery adapters
- isolate external provider logic
- keep domain workflows outside transport code

Priority:

- medium

## Milestone 10 - Tests Around Architecture Boundaries

Goal:

- make the new architecture safe to maintain

Tasks:

- backend integration tests for auth, roles, incidents, planning, war room
- frontend tests for route metadata and feature hooks
- keep end-to-end tests focused on critical user paths

Priority:

- high

## Working Rules For Every Next Refactor

When touching a feature:

1. do not add new code in the old style
2. extract one boundary if possible
3. reduce duplication if seen
4. prefer a vertical slice over broad mechanical churn
5. leave a clear structure behind, even if migration is incomplete

## How To Decide The Next Task

Choose the next task by this order:

1. security and access control risk
2. architectural inconsistency in high-churn code
3. file size and mixed responsibilities
4. duplicated metadata or business rules
5. missing tests around refactored seams

## Definition Of Progress

The migration is progressing well when:

- fewer large files own mixed responsibilities
- fewer duplicated permission/path definitions exist
- more features use shared policy helpers
- more frontend pages compose hooks instead of calling APIs directly
- more backend modules separate controller logic from domain workflows
