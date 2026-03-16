AUDIT MODE — patch only, no full file rewrites.

Scan all files under frontend/src/domains/*/ipc/.
Verify each IPC wrapper follows ADR-013:
  - Uses safeInvoke (never raw invoke())
  - Calls requireSessionToken() before every invoke
  - Passes session_token as first payload argument
  - Calls queryClient.invalidateQueries on mutations
  - Returns typed results (no `any`)

For each violation found:
  1. Print the file path + line number + violation type
  2. Produce a minimal diff patch to fix it
  3. Do NOT refactor surrounding code

Reference: frontend/src/lib/ipc.ts, ADR-013
