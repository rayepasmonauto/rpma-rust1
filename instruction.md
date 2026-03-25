PATCH MODE — Perform a senior-level refactor on this RPMA v2 code.

Project context:
- Stack: Tauri 2.1 / Rust (edition 2021) / Next.js 14 / SQLite WAL
- Strict four-layer backend: IPC → Application → Domain → Infrastructure (ADR-001)
- RBAC enforced at IPC boundary via resolve_context! (ADR-006, ADR-018)
- Type safety across the IPC boundary via ts-rs (ADR-015)
- Server state on frontend via TanStack Query only (ADR-014)
- Cross-domain coordination via EventBus (ADR-016) or shared services (ADR-003)

Goals:
- Improve readability (Rust idiomatic patterns, clear domain language)
- Reduce complexity (flatten match chains, extract domain methods)
- Enforce layer responsibilities (no logic leaking into IPC or Infrastructure)

Process:
1. Identify code smells with layer context
2. Prioritize low-risk improvements (pure domain functions first, IPC last)
3. Apply incremental refactors:
   - Extract methods respecting layer boundaries
   - Simplify conditionals using guard clauses and enum methods
   - Remove duplication using shared/ or domain traits
   - Improve naming per domain vocabulary (tasks, interventions, PPF)

Constraints:
- Zero behavior change
- Minimal diff — no file moves unless clearly needed
- No over-engineering — don't introduce new abstractions not already present in the codebase
- IPC command signatures and TS types: flag any change requiring npm run types:sync

Output:
- Final refactored code (Rust and/or TypeScript)
- List of changes with layer annotation (IPC / App / Domain / Infra / Frontend)
- Reasoning per change referencing the relevant ADR when applicable
```
