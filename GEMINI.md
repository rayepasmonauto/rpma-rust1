# GEMINI.md

## Stack

* Frontend: Next.js 14, React 18, TypeScript, Tailwind CSS, shadcn/ui.
* Backend: Rust + Tauri.
* Database: SQLite with WAL mode.
* Types: Rust models exported to TypeScript via ts-rs. Generated files live in `frontend/src/types/` and must not be edited manually.

## Project structure

```text
rpma-rust1/
├── frontend/                  # Next.js App Router app
│   ├── src/
│   │   ├── app/               # Route pages and layouts
│   │   ├── components/        # Shared UI components
│   │   ├── domains/           # Frontend feature domains
│   │   │   └── [domain]/
│   │   │       ├── api/       # React Query public API surface
│   │   │       ├── components/ # Domain UI
│   │   │       ├── hooks/     # Domain hooks
│   │   │       ├── ipc/       # Domain IPC wrappers
│   │   │       ├── services/  # Frontend business logic
│   │   │       └── stores/    # Zustand stores when needed
│   │   ├── hooks/             # Shared custom hooks
│   │   ├── lib/               # IPC client, utilities, query keys
│   │   ├── shared/            # Shared contracts and helpers
│   │   └── types/             # AUTO-GENERATED — DO NOT EDIT
│   └── package.json
│
├── src-tauri/
│   ├── src/
│   │   ├── commands/          # Cross-domain/system command modules
│   │   ├── domains/           # Backend bounded contexts
│   │   │   └── [domain]/
│   │   │       ├── ipc/           # Tauri command entry points, thin only
│   │   │       ├── application/   # Use cases, orchestration, auth enforcement
│   │   │       ├── domain/        # Pure business rules, entities, validation
│   │   │       ├── infrastructure/# Repositories, SQL, adapters
│   │   │       └── tests/         # unit, integration, permission, validation
│   │   ├── shared/                # Errors, auth middleware, event bus, utilities
│   │   ├── db/                    # DB connection, pool, pragmas, migrations
│   │   ├── main.rs                # Tauri builder and command registration
│   │   └── bin/                   # Type export binary
│   ├── migrations/                # Embedded SQLite migrations
│   └── Cargo.toml
│
├── scripts/                       # Validation, architecture, IPC, type scripts
├── docs/                          # Project docs and ADRs
├── Makefile
├── package.json
└── Cargo.toml

```

## Commands

Use the real command surfaces below; do not invent a root `npm run test` shortcut.

* **App / dev:** `npm run dev`, `npm run dev:types`, `npm run frontend:dev`
* **Frontend checks:** `npm run frontend:lint`, `npm run frontend:type-check`, `cd frontend && npm run test:ci`, `cd frontend && npm run test:e2e`
* **Backend checks:** `npm run backend:check`, `npm run backend:clippy`, `npm run backend:fmt`, `make test`, `cd src-tauri && cargo test --test <target>`
* **Types:** `npm run types:sync`, `npm run types:validate`, `npm run types:drift-check`, `npm run types:watch`
* **Database / migrations:** `node scripts/validate-migration-system.js`, `node scripts/detect-schema-drift.js`, `npm run backend:migration:fresh-db-test`

## Non-negotiable engineering rules

### 1) Preserve offline-first behavior

* Local SQLite is the system of record.
* New features must work without internet unless the requirement explicitly says otherwise.
* If sync-related behavior is involved, enqueue/track work using existing sync mechanisms instead of inventing ad hoc network flows.

### 2) Respect DDD and layer boundaries

* Do not have React components call Tauri directly if the repo already uses domain IPC wrappers.
* Do not put authorization in the frontend only.
* Do not place SQL in application/domain layers.
* Do not place business validation only in the UI.

### 3) Preserve domain isolation

* Put new code in the owning domain.
* Do not import another domain’s internal components/services/repositories directly.
* If cross-domain collaboration is required, use existing public interfaces, shared services, or established event patterns.

### 4) Keep IPC thin

* IPC handlers should authenticate, establish request context, map inputs/outputs, and delegate.
* Complex orchestration belongs in the application layer.

### 5) Enforce RBAC and session security

* Every new command or privileged action must be authenticated and role-checked according to existing patterns.
* Never assume frontend hiding is sufficient protection.
* Permission failure paths must be tested.

### 6) Keep types generated, not duplicated

* Do not manually redefine Rust-owned payload types in TypeScript if they are meant to cross the IPC boundary.
* Use the generated types workflow already present in the repo.

### 7) Make changes incrementally

* Prefer small, reviewable diffs.
* Reuse existing abstractions before creating new ones.
* Avoid broad refactors unless the task explicitly requires them.

---

## Expected repo patterns

### Backend

When implementing backend functionality, follow the existing domain structure under the Rust backend domains. A typical feature belongs inside one domain and should usually touch:

* `ipc/` for Tauri command handlers
* `application/` for use-case orchestration
* `domain/` for entities, value objects, validation, rules
* `infrastructure/` for repositories and persistence

### Frontend

The frontend mirrors backend bounded contexts. Domain-specific frontend code should live under the corresponding frontend domain structure. Common expectations:

* `api/` for React Query hooks
* `components/` for domain UI
* `hooks/` for domain hooks/Zustand state
* `ipc/` for typed domain wrappers
* `services/` for frontend-side business shaping/transforms

Use shared UI primitives from the common UI layer, but do not import another domain’s private UI internals.

### IPC calling convention

Frontend code should use:

1. shared safe IPC foundation
2. domain-level typed IPC wrappers

Do not call low-level Tauri invoke directly from arbitrary components if the project already provides the abstraction.

---

## How to implement features

When asked to build or modify a feature, follow this order:

1. Identify the owning domain.
2. Find the existing end-to-end path for the nearest similar feature.
3. Extend the backend through the proper layers.
4. Extend or regenerate shared types if IPC payloads changed.
5. Add/update frontend domain IPC wrappers, query hooks, and UI.
6. Add tests for success, validation failure, and authorization failure.
7. Run the project verification commands relevant to the change.

Prefer adapting an existing vertical slice over inventing a parallel architecture.

---

## Testing requirements

Testing is mandatory, not optional. The repository’s testing policy requires:

* Bug fixes must include a regression test.
* New features must include:
* success-path coverage
* input validation failure coverage
* permission/RBAC failure coverage


* Tests should live in the owning domain.

Before considering work complete, run the most relevant checks available in the repo, especially the quality and architecture enforcement commands already defined by the project. The repository includes checks for architecture boundaries, backend boundaries, type integrity, RBAC auditing, migration freshness, and maintainability/complexity.

If you cannot run commands in the environment, still write the code and explicitly list which checks should be run by the human reviewer.

---

## Database and persistence guidance

Use SQLite as the primary local store and preserve established reliability/performance assumptions such as WAL-oriented local operation and pooled access patterns.

When changing persistence behavior:

* Keep SQL and repository details in infrastructure.
* Respect migration workflows already used by the repository.
* Avoid schema shortcuts that bypass the migration system.
* Consider impact on sync, reporting, and auditability where relevant.

Do not introduce remote-first persistence assumptions.

---

## Frontend guidance

On the frontend:

* Mirror backend domain boundaries.
* Use TanStack Query for server/backend state.
* Use Zustand for local/global UI state where appropriate.
* Keep pages/components thin when possible; move reusable logic into domain hooks/services.
* Use typed IPC wrappers instead of raw invoke calls.
* Use generated types from Rust contracts instead of handwritten duplicates.

When building forms or workflows, ensure the frontend validates for UX, but keep the backend/domain as the ultimate enforcer of business rules.

---

## What not to do

Do not:

* Invent a second architecture beside the current DDD structure.
* Bypass domain IPC wrappers from frontend components.
* Put business logic in SQL, page components, or Tauri command glue.
* Duplicate generated cross-boundary types manually.
* Create cross-domain imports that violate boundaries.
* Skip tests because the change looks “small.”
* Make large opportunistic refactors unrelated to the task.
* Replace existing stack choices unless explicitly requested and justified.

---

## When unsure

If a requirement is ambiguous or conflicts with architecture rules, choose the most conservative compliant option and explicitly say so.

when unsure check docs:

* `docs/README.md`
* `docs/adr/`
