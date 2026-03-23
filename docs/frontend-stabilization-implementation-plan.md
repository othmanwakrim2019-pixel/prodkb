> [!WARNING]
> **DEPRECATED — Historical planning document.** This refactor is complete. The work described here has been implemented. Do not treat this as current guidance. See [ARCHITECTURE.md](ARCHITECTURE.md) for the current architecture contract.

# Frontend Stabilization Implementation Plan

## Goal

The frontend architecture is now largely normalized. The next phase is not structural refactoring, but stabilization:

- verify that every major screen still works
- fix runtime regressions and missing-data issues
- replace low-quality UX patterns left from the old code
- harden the frontend with focused tests

This plan defines what remains to be done before the frontend can be considered clean, reliable, and production-ready.

---

## Current State

### Already done

- Feature-based frontend structure is in place under `src/features`
- Route entry files under `src/pages` are thin
- Old duplicate folders and unused compatibility files were removed
- API access is mostly centralized into feature API modules
- Response-shape normalization was added to reduce missing-data issues
- `npm run typecheck` passes
- `npm run test` passes

### Still remaining

- Some screens still rely on `alert`, `confirm`, or `prompt`
- Many pages still use direct `console.error` handling instead of a cleaner UI error pattern
- We still need a real runtime verification pass across the application
- Frontend automated tests still have warning cleanup to do

---

## Scope

This phase is frontend only.

Do not:

- change backend behavior unless a frontend blocker proves the contract is broken
- rebuild features from scratch
- do more architecture reshuffling unless a bug requires it

Do:

- fix frontend bugs
- improve UX consistency
- verify existing flows
- add or repair targeted tests

---

## Phase 1: Runtime Verification

### Objective

Check the real application flow screen by screen and identify regressions introduced during refactoring.

### Areas to verify

#### Auth and shell

- login page
- logout flow
- session timeout warning
- notification bell
- protected routes
- forbidden page
- sidebar and route navigation

#### Dashboard

- dashboard statistics rendering
- charts and widgets
- health widget
- status page

#### Incidents

- incident list
- incident filters
- incident creation
- incident details
- logs
- file upload and preview
- post-mortem tab
- war room messages

#### Procedures

- procedures list
- procedure details
- create procedure
- edit procedure
- incident-to-procedure linking

#### Planning

- planning instance list
- create instance modal
- add job modal
- edit job modal
- import CSV modal
- table view
- flow view
- clone/archive/delete actions

#### Admin

- users
- teams
- systems/jobs
- SLAs
- roles and permissions
- audit logs
- audit config
- email templates
- escalation rules
- auto-assignment rules
- webhooks
- maintenance admin
- settings

### Deliverable

A bug list grouped by feature:

- broken behavior
- exact file involved
- severity
- reproduction steps

---

## Phase 2: Bug Fixes

### Objective

Fix all concrete runtime regressions found during verification.

### Highest-priority bug categories

#### Data shape and rendering bugs

Examples:

- arrays not rendering because payload shape is different
- object fields missing after feature refactor
- forms assuming nested data that is undefined

#### Broken action flows

Examples:

- create/update/delete actions not refreshing UI correctly
- wrong route after submit
- modals not reopening with correct state
- stale selection after save/delete

#### Real-time and sync issues

Examples:

- notification state not updating
- war room history/messages mismatch
- planning refresh not reflecting latest jobs

### Deliverable

A stable frontend where all major screens render and core actions complete successfully.

---

## Phase 3: UX Consistency Cleanup

### Objective

Replace old low-quality interaction patterns that make the frontend feel inconsistent.

### Items to fix

#### Replace browser dialogs

Replace:

- `alert(...)`
- `confirm(...)`
- `prompt(...)`

With:

- toast system
- confirm dialog system
- proper in-app modal/forms

### Priority files

- `src/features/admin/components/UserTable.tsx`
- `src/features/planning/components/PlanningTableView.tsx`
- `src/features/admin/pages/*.tsx`
- `src/features/incidents/pages/IncidentsPage.tsx`
- `src/features/procedures/pages/ProcedureDetailsPage.tsx`

#### Standardize error presentation

Replace ad hoc `console.error + silent failure` with:

- user-visible error message when action fails
- retry button where appropriate
- toast for mutation failures

### Deliverable

Cleaner user experience with no browser-native confirmation UX in feature flows.

---

## Phase 4: Error Handling Standard

### Objective

Create a consistent frontend rule for mutation and loading errors.

### Standard to apply

#### For list/load screens

- show loading state
- show inline error state
- allow retry

#### For mutations

- show success toast on success
- show error toast on failure
- avoid silent failure

#### For destructive actions

- always use app confirm dialog
- no browser `confirm`

### Deliverable

A predictable user-facing error handling model across all features.

---

## Phase 5: Test Hardening

### Objective

Protect the refactored feature structure from regressions.

### Test priorities

#### Auth

- `AuthContext`
- login page
- protected route behavior

#### Planning

- planning page data load
- add job modal
- create instance modal
- response-shape handling

#### Incidents

- incident list rendering
- create incident form
- incident details sections
- war room message load

#### Admin

- user table
- role manager
- team/system CRUD screens

### Tooling problem to resolve

`npm run test` is now running successfully.

Current test status:

- 5 test files passing
- 36 tests passing

What remains here is warning cleanup and targeted coverage expansion.

### Warnings to clean

- React Router future flag warnings in tests
- `act(...)` warning around auth/login-related state updates

### Next testing work

- align test router setup with the same future flags used by the application router
- remove async test warnings so test output is clean
- add targeted tests for planning/admin/runtime edge cases found during manual verification

### Deliverable

Working frontend test runs with clean output and coverage around the highest-risk feature flows.

---

## Recommended Execution Order

1. Run manual runtime verification on high-risk flows
2. Fix blocking runtime bugs
3. Replace remaining browser dialog patterns
4. Standardize user-facing error handling
5. Clean test warnings and extend targeted test coverage
6. Do a final cleanup pass only if new dead code appears after fixes

---

## Definition of Done

The frontend will be considered done for this phase when all of the following are true:

- all major screens render without runtime crashes
- no major data areas appear empty because of frontend response handling bugs
- destructive flows use app confirm dialogs, not browser confirms
- mutation failures are shown cleanly to the user
- `npm run typecheck` passes
- `npm run test` passes cleanly without avoidable warnings

---

## Immediate Next Actions

If we continue implementation, the next concrete tasks should be:

1. Audit and fix browser-dialog usage beginning with admin and planning
2. Standardize failure toasts and retry states in admin/planning/incidents
3. Run a manual feature verification checklist and fix discovered regressions
4. Clean the remaining frontend test warnings
