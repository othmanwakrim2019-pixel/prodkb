> [!WARNING]
> **DEPRECATED — Historical planning document.** This integration hardening pass is complete. Do not treat this as current guidance. See [ARCHITECTURE.md](ARCHITECTURE.md) for the current architecture contract.

# Backend Integration Hardening Plan

## Goal

The backend service and architecture refactor is stable at the unit and service level.
This phase hardens the HTTP boundary and test runtime so the most important authorization flows are protected end to end.

## Current State

What is already done:

- service-level regression tests cover auth, refresh tokens, incidents, SLA enforcement, roles, users, and escalation
- the backend test suite passes
- coverage thresholds pass

What still needs hardening:

- the full Jest run still reports an open-handles warning
- authorization behavior is not yet fully covered at the integration level
- incident visibility rules need direct HTTP-level regression coverage

## Priorities

### Priority 1: Test Runtime Cleanup

Target:

- eliminate or reduce Jest forced-exit warnings by closing shared runtime handles cleanly

Likely handles:

- BullMQ queues
- Redis client
- Prisma client

Implementation:

- add a shared Jest teardown file
- close queue connections and infrastructure clients after the suite

### Priority 2: Authorization Integration Coverage

Target routes:

- `/api/v1/users`
- `/api/v1/roles`
- `/api/v1/incidents`

Required behaviors:

- `401` when no authentication is provided
- `403` when authentication is valid but permission is missing
- successful access when the required permission is present

### Priority 3: Incident Visibility Integration Coverage

Required behaviors:

- admin users can see all incidents
- users with `VIEW_ALL_INCIDENTS` can see all incidents
- regular users only see incidents assigned to their teams
- regular users cannot fetch incident details for incidents outside their teams

## Execution Order

1. add Jest teardown for shared handles
2. add authorization integration tests
3. add incident visibility integration tests
4. rerun the full backend suite
5. confirm typecheck remains green

## Definition Of Done

This integration hardening pass is complete when:

- shared test handles are shut down deliberately
- authorization and incident visibility are covered end to end
- the backend test suite passes
- `npm run typecheck` passes
