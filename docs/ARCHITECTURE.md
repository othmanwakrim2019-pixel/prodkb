# Architecture Contract

## Purpose

This document defines the mandatory architecture rules for ProdKB.

It is not a suggestion. It is the default system design that all new code and all refactors must follow.

If a module does not follow this structure yet, it is considered legacy and should be migrated toward this contract over time.

## Design Principles

ProdKB must follow one consistent architecture:

- modular monolith
- feature-first organization
- layered responsibilities
- shared cross-cutting services
- explicit boundaries between transport, business rules, and persistence

Primary goals:

- readability
- scalability
- safe refactoring
- predictable feature development
- reduced duplication

## Backend Standard

### Target structure

```text
backend/src/
  app/
  common/
    auth/
    middleware/
    errors/
    utils/
    services/
  modules/
    <feature>/
      presentation/
      application/
      domain/
      infrastructure/
```

### Backend layers

#### 1. Presentation

Contains:

- Express routes
- controllers
- request validation schemas
- DTO mapping

Rules:

- routes only wire middleware and controller actions
- controllers parse request input and format response output
- controllers must not query Prisma directly
- controllers must not contain core business rules

#### 2. Application

Contains:

- use cases
- orchestration services
- transactional workflows
- permission-aware workflows

Rules:

- one use case should own one business action
- multi-step writes must be handled here
- cross-repository operations belong here
- logging and audit orchestration can start here, not in routes

#### 3. Domain

Contains:

- business rules
- policies
- invariants
- repository interfaces
- domain types and value objects

Rules:

- no Express imports
- no Prisma imports
- no infrastructure details

#### 4. Infrastructure

Contains:

- Prisma repositories
- external gateways
- mappers
- adapter implementations

Rules:

- infrastructure implements contracts defined by domain or application
- raw Prisma access should move here for complex features

## Frontend Standard

### Target structure

```text
frontend/src/
  app/
    router/
    providers/
    layout/
  shared/
    ui/
    hooks/
    lib/
    types/
  features/
    <feature>/
      api/
      hooks/
      components/
      pages/
      model/
```

### Frontend layers

#### 1. App layer

Contains:

- router setup
- route metadata
- global providers
- application shell

Rules:

- app layer must not own feature business logic
- route metadata must be centralized

#### 2. Feature API layer

Contains:

- API clients
- request/response mapping
- feature-specific transport helpers

Rules:

- pages must not call `axios` directly
- feature API must hide transport details from components

#### 3. Feature hooks layer

Contains:

- stateful orchestration
- data loading
- mutations
- derived UI state

Rules:

- big page state should move here
- hooks should coordinate feature API calls and UI events

#### 4. Feature components layer

Contains:

- reusable feature UI
- form sections
- tables
- detail blocks

Rules:

- components should be as presentational as possible
- transport logic should not live here unless the component is intentionally a container

#### 5. Shared UI layer

Contains:

- reusable design system pieces
- modal, toast, loader, confirm dialog, pagination, form controls

Rules:

- shared components must remain generic
- feature logic must not leak into shared UI

## Cross-Cutting Rules

### Authentication and authorization

- permission logic must be centralized in shared policy helpers
- socket authorization and REST authorization must use the same policy source
- frontend permission checks are UX only
- backend is the source of truth for access control

### Validation

- all external input must be validated at the boundary
- backend request validation belongs in presentation schemas
- domain-level invariants must still be enforced in business logic

### Transactions

- any operation that modifies multiple records must be handled in one use case
- transactions must live in the application or infrastructure layer, not in controllers

### Error handling

- controllers should throw typed application errors or delegate to service errors
- no raw `alert`, `confirm`, or `console.error` as final UX behavior in production-facing flows
- frontend errors should flow through shared toast/dialog patterns

### Logging

- infrastructure failures and security failures must be logged
- audit logging should be triggered from business workflows, not ad hoc in random places

## Forbidden Patterns

The following patterns are legacy and should not be added in new code:

- Prisma queries in controllers
- business logic inside route files
- direct `axios` usage in large page components
- duplicated permission maps across multiple frontend files
- duplicated path definitions across router and sidebar
- feature-specific logic inside generic shared components
- giant “god files” growing without extraction

## File Size Guidance

Soft limits:

- controller files: under 200 lines
- route files: under 100 lines
- hooks: under 200 lines
- page components: under 200-250 lines
- service/use-case files: split when they mix multiple responsibilities

Generated files and schema files are exceptions.

## Canonical Sources Of Truth

### Backend

- auth user hydration: shared auth context service
- authorization rules: shared policy helpers
- feature workflows: application layer

### Frontend

- route and nav metadata: app router metadata
- permission checks: auth context helpers
- API contracts: feature API files

## Migration Strategy

Legacy modules do not need full rewrite.

Migration rule:

1. stabilize the feature
2. extract shared policy/metadata
3. split the largest mixed-responsibility file
4. move the feature toward the standard structure

Each refactor should leave the feature more aligned than before.

## Definition Of Compliance

A module is architecture-compliant when:

- routes only route
- controllers only adapt requests/responses
- business rules live in application/domain code
- data access is behind an explicit feature boundary
- permissions come from shared policy logic
- frontend pages compose hooks and components instead of owning transport logic
- route metadata is not duplicated

## Pull Request Checklist

Before merging architectural work, confirm:

- does this add any new direct Prisma usage in controllers
- does this add any new direct `axios` usage in pages
- does this duplicate route or permission metadata
- does this move the feature closer to the standard structure
- does this keep backend authorization as the source of truth
