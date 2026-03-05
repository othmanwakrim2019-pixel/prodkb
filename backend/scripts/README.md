# Scripts — ProdKB Backend

> One-off and utility scripts. **Not part of the application runtime.**
> Run with: `npx tsx scripts/<script-name>.ts`

---

## Recovery / Admin

| Script | When to run |
|---|---|
| `restore-admin.ts` | Admin user was deleted or locked out — recreates it with default password |
| `fix-permissions.ts` | Permission codes got out of sync — resets all roles to correct permissions |
| `add-search-permission.ts` | Adds the `SEARCH` permission code to all roles that should have it |
| `create-viewer-role.ts` | VIEWER role is missing — creates it with read-only permissions |
| `grant-operator-edit.ts` | Grants OPERATOR role the `INCIDENT_EDIT` permission |
| `update-permissions.ts` | Bulk-updates permission codes after a naming change |

## Data / Testing

| Script | When to run |
|---|---|
| `get-test-users.ts` | Lists all users in the database — useful after seeding to get login credentials |
| `seed-csv-jobs.ts` | Imports jobs/systems from a CSV file into the database |
| `verify-fixes.ts` | Verifies the database state is correct after running recovery scripts |
