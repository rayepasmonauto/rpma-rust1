﻿AUDIT MODE – PATCH OUTPUT REQUIRED

Target: `src-tauri/src/`.

Checks:
- IPC commands missing correlation ID propagation (ADR-007)
- Application services without entry/exit span (`tracing::instrument`)
- Slow-path code (loops, heavy queries) without duration logging
- Missing audit event emission after state-changing operations (ADR audit domain)
- Log levels misused (debug! for auth failures, error! for expected validation)

Output diffs that add/correct instrumentation.