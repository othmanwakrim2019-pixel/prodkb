> [!WARNING]
> **DEPRECATED — Historical planning document.** This stabilization pass is complete. The work described here has been implemented. Do not treat this as current guidance. See [ARCHITECTURE.md](ARCHITECTURE.md) for the current architecture contract.

# Backend Stabilization Implementation Plan

## Purpose

The backend architecture refactor is now far enough along that the next priority is stability, not more structural churn.
This plan defines how to verify the refactored backend, close the highest-risk coverage gaps, and fix regressions before any deeper cleanup continues.

## Current State

What is already in place:

- The backend now follows a much more consistent `route -> controller -> service -> repository` flow across the main modules.
- Core modules such as `auth`, `incidents`, `planning`, `systems`, `teams`, `users`, `roles`, `procedures`, `sla`, `auto-assign`, and `escalation` have already been normalized.
- Jest is configured and there is an existing backend test suite under `backend/tests`.

What is still missing:

- Test coverage does not yet match the refactored seams.
- Existing tests still focus mostly on older service shapes and a small number of integration paths.
- The highest-risk business flows touched by the refactor do not yet have enough regression protection.

## Existing Test Coverage Snapshot

Current backend tests:

- `backend/tests/AuthService.test.ts`
- `backend/tests/IncidentService.test.ts`
- `backend/tests/UserService.test.ts`
- `backend/tests/sla-enforcement.test.ts`
- `backend/tests/api.test.ts`
- `backend/tests/health.test.ts`
- `backend/tests/emailService.test.ts`
- `backend/tests/integration/auth.test.ts`
- `backend/tests/integration/auth-cookie.test.ts`
- `backend/tests/integration/error_handling.test.ts`

Main gaps:

- little or no focused coverage for repository-backed auth token rotation
- limited regression coverage for incident create/update/version-conflict behavior
- limited escalation and SLA orchestration coverage after repository extraction
- limited coverage for role permission replacement and user/role interactions
- no dedicated test pass validating the refactored boundaries as a system

## Stabilization Priorities

### Priority 1: Critical Auth and Session Flows

Target files:

- `backend/src/modules/auth/auth.service.ts`
- `backend/src/modules/auth/refresh-token.service.ts`

Required coverage:

- register rejects duplicate email
- register rejects weak password
- register rejects invalid team
- login rejects locked account
- login rejects invalid credentials and records failed attempts
- login rejects inactive accounts
- login returns token, refresh token, and permissions for valid users
- refresh rejects missing token
- refresh rejects revoked token and revokes all sessions
- refresh rejects expired token
- refresh rejects inactive user
- refresh rotates token correctly

### Priority 2: Incident Workflow Regressions

Target files:

- `backend/src/modules/incidents/services/incident-crud.service.ts`
- `backend/src/modules/incidents/services/incident-status.service.ts`

Required coverage:

- create rejects invalid system
- create rejects invalid job
- create auto-assigns team when no explicit assignment is provided
- update rejects invalid status transition
- update sets acknowledge timestamps correctly
- update sets resolved timestamps correctly
- update throws optimistic concurrency conflict on stale version
- delete removes existing incident and rejects missing incident
- linkProcedure rejects missing procedure

### Priority 3: Escalation and SLA Safety Nets

Target files:

- `backend/src/modules/sla/sla-enforcement.service.ts`
- `backend/src/modules/escalation/escalation.service.ts`

Required coverage:

- breach detection marks incidents breached
- breach detection writes an incident log
- breach detection triggers escalation
- escalation pass only emits webhook when level actually increases
- escalation errors are logged but do not crash the batch

### Priority 4: Access and Role Management

Target files:

- `backend/src/modules/roles/role.service.ts`
- `backend/src/modules/users/user.service.ts`

Required coverage:

- role permission replacement returns updated permissions
- role permission replacement remains atomic on failure
- merged user permissions are returned correctly
- user updates invalidate downstream auth assumptions correctly

## Execution Order

### Phase 1: Test Harness Alignment

- confirm current Jest setup works with the refactored code
- keep tests rooted under `backend/tests`
- prefer targeted service tests with repository mocks for fast feedback
- use integration tests only for a few critical HTTP flows

### Phase 2: High-Risk Service Tests

Implement or refresh tests for:

1. `auth.service`
2. `refresh-token.service`
3. `incident-crud.service`
4. `sla-enforcement.service`
5. `escalation.service`

### Phase 3: Core Management Tests

Implement or refresh tests for:

1. `role.service`
2. `user.service`

### Phase 4: Integration Verification

Add or refresh integration coverage for:

- auth login and cookie behavior
- permission-protected endpoints returning expected `401` and `403`
- one incident create/update happy path

### Phase 5: Regression Fix Pass

- run the full backend test suite
- fix any regressions revealed by the new tests
- run `npm run typecheck`

## Test Design Rules

- mock repositories instead of mocking Prisma directly when testing refactored services
- keep one test file focused on one service or workflow
- prefer behavior assertions over implementation-coupled assertions
- cover failure paths, not just happy paths
- avoid reintroducing knowledge of deleted controller/service shapes into tests

## Definition Of Done

This stabilization pass is complete when:

- the high-risk refactored services have direct regression coverage
- backend tests pass consistently
- `npm run typecheck` passes
- no new regressions are introduced while adding the tests
- the test suite reflects the current architecture instead of the pre-refactor structure

## Immediate Next Steps

1. Add focused tests for `auth.service` and `refresh-token.service`.
2. Add focused tests for `incident-crud.service`.
3. Refresh `sla-enforcement` coverage to assert current repository-based behavior.
4. Run the backend test suite and fix any issues found.
