﻿AUDIT MODE – MIGRATION PLAN + PATCH OUTPUT REQUIRED

Files: `src-tauri/src/services/`, `src-tauri/src/repositories/`

These are legacy layers that must be migrated into DDD domain modules under `src-tauri/src/domains/`.

For each file found:
1. Identify the target domain (auth, tasks, interventions, inventory, etc.)
2. Map the function to the correct DDD layer (application service, repository, or domain model)
3. Output a diff patch moving the code to `src-tauri/src/domains/<domain>/<layer>/`
4. Output the updated `src-tauri/src/main.rs` import/registration patch
5. Flag any circular dependencies introduced by the migration

Do not delete the legacy file — add `#[deprecated]` attribute and a doc comment pointing to the new location.