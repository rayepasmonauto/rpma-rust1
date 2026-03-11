# RPMA v2 - Dev Workflows and Tooling

> Development commands, scripts, CI/CD, and quality gates.

---

## Running the Application

### Development Mode

```bash
# Standard dev (requires types:sync first if types changed)
npm run dev

# Dev with type sync (recommended)
npm run dev:types

# Strict dev (type sync + drift check)
npm run dev:strict
```

**What it does**:
1. Starts Next.js dev server (frontend)
2. Starts Tauri with Rust backend
3. Hot reload for both frontend and backend

### Frontend Only

```bash
# Run just the frontend (useful for UI work)
npm run frontend:dev

# Or manually
cd frontend && npm run dev
```

### Type Generation

```bash
# Sync Rust types to TypeScript (MUST run after Rust model changes)
npm run types:sync

# Watch mode (auto-regenerate on Rust changes)
npm run types:watch

# Check for drift (CI)
npm run types:drift-check
```

---

## Build Commands

### Production Build

```bash
# Full build (types + frontend + backend + Tauri)
npm run build

# Frontend only
npm run frontend:build

# Backend only
cd src-tauri && cargo build --release
```

### Bundle Analysis

```bash
# Analyze frontend bundle size
cd frontend && ANALYZE=true npm run build
```

---

## Testing

### Frontend Tests

```bash
# Unit tests (Jest)
cd frontend && npm run test:ci

# E2E tests (Playwright)
cd frontend && npm run test:e2e

# Watch mode
cd frontend && npm run test:watch
```

### Backend Tests

```bash
# All Rust tests
cd src-tauri && cargo test

# Specific test target
cd src-tauri && cargo test --test auth_commands_test

# Migration tests
npm run backend:migration:fresh-db-test
```

### Test Categories

| Test Type | Command | Location |
|-----------|---------|----------|
| Unit | `cargo test` | `src-tauri/src/*/tests/unit_*.rs` |
| Integration | `cargo test --test *` | `src-tauri/tests/` |
| Commands | `cargo test --test *_commands_test` | `src-tauri/tests/commands/` |
| E2E | `npm run test:e2e` | `frontend/tests/e2e/` |
| Migration | `npm run backend:migration:fresh-db-test` | `src-tauri/src/tests/migrations/` |

---

## Quality Gates and Scripts

### Type Checking

```bash
# Frontend TypeScript
cd frontend && npm run type-check

# Backend Rust
cd src-tauri && cargo check
```

### Linting

```bash
# Frontend ESLint
npm run frontend:lint

# Backend Clippy
npm run backend:clippy

# Backend Format Check
cd src-tauri && cargo fmt -- --check
```

### Architecture Enforcement

```bash
# Full architecture check
npm run architecture:check

# Strict mode (fails on warnings)
npm run architecture:check:strict

# Backend module boundaries
npm run backend:boundaries:check

# Cross-domain import detection
npm run backend:detect-cross-domain

# Bounded context validation
npm run validate:bounded-contexts
```

### Security and Quality

```bash
# Security audit
npm run security:audit

# IPC authorization audit
node scripts/ipc-authorization-audit.js

# IPC consistency check
node scripts/ipc-consistency-check.js

# Code duplication detection
npm run duplication:detect

# Maintainability audit
npm run maintainability:audit

# Complexity enforcement
npm run complexity:enforce
```

### Database Checks

```bash
# Schema drift detection
node scripts/detect-schema-drift.js

# Migration system validation
node scripts/validate-migration-system.js

# Migration tests
npm run backend:migration:fresh-db-test
```

---

## Full Quality Gate

### Pre-Commit Checklist

Run these before committing:

```bash
# 1. Type check
npm run types:sync && npm run types:drift-check

# 2. Frontend checks
npm run frontend:lint && npm run frontend:type-check

# 3. Backend checks
npm run backend:check && npm run backend:clippy && npm run backend:fmt

# 4. Architecture
npm run architecture:check

# 5. Backend boundaries
npm run backend:boundaries:check

# 6. Migration check
npm run backend:migration:fresh-db-test
```

### Production Gate

```bash
# Full production validation (CI pipeline)
npm run prod:gate

# Includes:
# - cargo fmt --check
# - cargo clippy -- -D warnings
# - cargo test
# - backend architecture check
# - IPC production gate
# - migration tests
```

---

## Key Scripts Reference

### Build & Dev

| Script | Command | Purpose |
|--------|---------|---------|
| Dev | `npm run dev` | Start Tauri dev mode |
| Dev Types | `npm run dev:types` | Dev with type sync |
| Dev Strict | `npm run dev:strict` | Dev with all checks |
| Build | `npm run build` | Production build |
| Frontend Dev | `npm run frontend:dev` | Frontend only |
| Tauri | `npm run tauri` | Tauri CLI |

### Types

| Script | Command | Purpose |
|--------|---------|---------|
| Types Sync | `npm run types:sync` | Rust → TS type generation |
| Types Watch | `npm run types:watch` | Auto-regenerate types |
| Types Validate | `npm run types:validate` | Validate generated types |
| Types Drift | `npm run types:drift-check` | Detect type mismatches |
| Types CI | `npm run types:ci-drift-check` | CI type check |

### Frontend Quality

| Script | Command | Purpose |
|--------|---------|---------|
| Lint | `npm run frontend:lint` | ESLint |
| Type Check | `npm run frontend:type-check` | TypeScript check |
| Encoding | `npm run frontend:encoding-check` | File encoding |
| Test CI | `cd frontend && npm run test:ci` | Unit tests |
| Test E2E | `cd frontend && npm run test:e2e` | E2E tests |

### Backend Quality

| Script | Command | Purpose |
|--------|---------|---------|
| Check | `npm run backend:check` | Cargo check |
| Clippy | `npm run backend:clippy` | Linting |
| Format | `npm run backend:fmt` | Format code |
| Test | `cd src-tauri && cargo test` | Run tests |
| Build | `npm run backend:build` | Debug build |
| Build Release | `npm run backend:build:release` | Release build |

### Architecture

| Script | Command | Purpose |
|--------|---------|---------|
| Arch Check | `npm run architecture:check` | Module boundaries |
| Arch Strict | `npm run architecture:check:strict` | Strict mode |
| Boundaries | `npm run backend:boundaries:check` | Backend isolation |
| Cross Domain | `npm run backend:detect-cross-domain` | Import violations |
| Bounded Contexts | `npm run validate:bounded-contexts` | DDD validation |
| Boundary Report | `npm run boundary:report` | Coverage report |
| Boundary Enforce | `npm run boundary:enforce` | Enforce coverage |

### Security & Quality

| Script | Command | Purpose |
|--------|---------|---------|
| Security Audit | `npm run security:audit` | Security checks |
| IPC Consistency | `npm run ipc:consistency-check` | IPC validation |
| IPC Prod Gate | `npm run ipc:production-gate` | Pre-release IPC check |
| Duplication | `npm run duplication:detect` | Code duplication |
| Complexity | `npm run complexity:enforce` | Cyclomatic complexity |
| Maintainability | `npm run maintainability:audit` | Maintainability |

### Database

| Script | Command | Purpose |
|--------|---------|---------|
| Migration Test | `npm run backend:migration:fresh-db-test` | Migration validation |
| Drift Check | `node scripts/detect-schema-drift.js` | Schema drift |
| Migration Audit | `npm run migration:audit` | Migration audit |

---

## "If You Change X, Run Y" Checklist

| Change | Required Scripts |
|--------|------------------|
| Rust model (add `#[ts(export)]`) | `npm run types:sync`, `npm run types:drift-check` |
| Rust command (new IPC) | `node scripts/ipc-consistency-check.js` |
| Frontend component | `npm run frontend:lint`, `npm run frontend:type-check` |
| SQL migration | `npm run backend:migration:fresh-db-test`, `node scripts/detect-schema-drift.js` |
| Cross-domain code | `npm run backend:detect-cross-domain`, `npm run architecture:check` |
| Form validation | `cd frontend && npm run test:ci` (include validation tests) |
| Auth/RBAC changes | `node scripts/ipc-authorization-audit.js` |
| Dependencies | `npm run security:audit` |
| Pre-commit | `npm run quality:check` |
| Pre-release | `npm run prod:gate` |

---

## Git Workflow

### Feature Branch Workflow

```bash
# Start new feature
npm run git:start-feature -- feature-name

# Sync with main (rebase)
npm run git:sync-feature

# Finish feature (merge to main)
npm run git:finish-feature

# Cleanup
npm run git:cleanup-feature
```

### Pre-commit Hook

```bash
# Install hooks
npm run prepare

# Hooks run automatically:
# - lint-staged (ESLint + Prettier)
# - type-check
```

---

## Environment Setup

### Prerequisites

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **Rust**: 1.85.0
- **Tauri CLI**: `npm install -g @tauri-apps/cli`

### Installation

```bash
# Clone repo
git clone <repo-url>
cd rpma-rust

# Install dependencies
npm install
npm run frontend:install

# Setup dev environment
cp .env.example .env

# Generate initial types
npm run types:sync

# Run dev
npm run dev
```

### VS Code Extensions (Recommended)

- rust-analyzer
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- SQLite Viewer

---

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml (typical structure)
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      # Setup Node.js
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      # Setup Rust
      - uses: dtolnay/rust-action@stable
      
      # Install dependencies
      - run: npm install
      
      # Type check
      - run: npm run types:sync
      - run: npm run types:ci-drift-check
      
      # Frontend quality
      - run: npm run frontend:lint
      - run: npm run frontend:type-check
      
      # Backend quality
      - run: npm run backend:check
      - run: npm run backend:clippy
      
      # Architecture
      - run: npm run architecture:check
      - run: npm run backend:boundaries:check
      
      # Tests
      - run: cd frontend && npm run test:ci
      - run: cd src-tauri && cargo test
      
      # Migration tests
      - run: npm run backend:migration:fresh-db-test
```

### Release Process

```bash
# 1. Version bump (follow semver)
# Update version in:
# - package.json
# - src-tauri/Cargo.toml
# - src-tauri/tauri.conf.json

# 2. Run full quality gate
npm run prod:gate

# 3. Build release
npm run build

# 4. Test release build
# - Install on clean machine
# - Verify migrations run
# - Smoke test core flows

# 5. Tag release
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin v0.1.0
```

---

## Debugging

### Frontend

```bash
# Next.js debug mode
NODE_OPTIONS='--inspect' npm run frontend:dev

# Tauri with DevTools
npm run tauri dev -- --debug
```

### Backend

```bash
# Rust backtrace
RUST_BACKTRACE=1 npm run dev

# Full backtrace
RUST_BACKTRACE=full npm run dev

# Specific log level
RUST_LOG=debug npm run dev
RUST_LOG=rpma=trace npm run dev
```

### Database

```bash
# Connect to DB
sqlite3 ~/path/to/db.sqlite

# Enable headers
.headers on
.mode column

# Check schema
.schema

# Check migrations
SELECT * FROM schema_version ORDER BY version DESC;
```

---

## Common Issues

### Build Failures

**Error**: `Cannot find module '@/types'`
- **Fix**: Run `npm run types:sync`

**Error**: `Type drift detected`
- **Fix**: Run `npm run types:sync` and commit changes

**Error**: `Migration checksum mismatch`
- **Fix**: Don't edit applied migrations; create new migration to fix

**Error**: `Cross-domain import detected`
- **Fix**: Use event bus or shared interfaces; check architecture rules

### Runtime Issues

**Error**: `session_token not found`
- **Fix**: Re-authenticate; check AuthSecureStorage

**Error**: `database is locked`
- **Fix**: Close other connections; check WAL mode enabled

---

## Next Steps

- **User Flows**: See [09_USER_FLOWS_AND_UX.md](./09_USER_FLOWS_AND_UX.md)

---

*Testing Policy: See docs/adr/017-testing-verification-policy.md*
