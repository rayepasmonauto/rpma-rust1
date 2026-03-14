AUDIT MODE — patch only.

Scan src-tauri/src/domains/*/application/services/*.rs.
Enforce that application services NEVER directly use sqlx, Database, or Connection types.

All data access must go through repository traits (ADR-005):
  - Services must receive Arc<dyn SomeTrait> repository parameters
  - No sqlx::query!() or conn.execute() calls in the application layer
  - No raw SQL strings in service files

For violations:
  1. Extract the SQL into the domain's infrastructure/repository/ module
  2. Add the method to the repository trait
  3. Patch the service to call repo.method() instead
