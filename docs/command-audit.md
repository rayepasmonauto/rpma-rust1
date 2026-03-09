# Command Audit

This report was built by reading the live repository files under `/home/runner/work/rpma-rust1/rpma-rust1` on 2026-03-09. It intentionally records the current state, including broken or stale command references, instead of normalizing them away.

## A. Complete Command Registry

| Command | Category | Source File | Description | Safe to run locally? |
| --- | --- | --- | --- | --- |
| `cd frontend && CI=true npm run build` | build | `.github/workflows/ci.yml` | Run the frontend production build in the check/build jobs. | Yes |
| `cd frontend && npm ci` | frontend | `.github/workflows/ci.yml` | Install frontend dependencies in the check and build jobs. | Yes |
| `cd frontend && npm run lint` | frontend | `.github/workflows/ci.yml` | Run frontend ESLint in the check job. | Yes |
| `cd frontend && npm run tauri build -- --target ${{ matrix.target }}` | release | `.github/workflows/ci.yml` | Build the Tauri bundle for the matrix target in the CI build job. | No — the literal command contains GitHub matrix interpolation. |
| `cd frontend && npm run test:ci` | test | `.github/workflows/ci.yml` | Run frontend Jest CI tests in the check job. | Yes |
| `cd frontend && npm run type-check` | frontend | `.github/workflows/ci.yml` | Run frontend TypeScript checks in the check job. | Yes |
| `cd src-tauri && cargo clippy --all-targets --all-features -- -D warnings` | backend | `.github/workflows/ci.yml` | Run strict Rust linting in CI. | Yes |
| `cd src-tauri && cargo fmt --all -- --check` | backend | `.github/workflows/ci.yml` | Verify Rust formatting in CI. | Yes |
| `cd src-tauri && cargo tarpaulin --out xml --output-dir target/coverage --skip-clean` | test | `.github/workflows/ci.yml` | Generate Rust coverage XML in the CI coverage step. | Yes — requires cargo-tarpaulin installed. |
| `cd src-tauri && cargo test --all --verbose` | test | `.github/workflows/ci.yml` | Run the full Rust test suite in CI. | Yes |
| `cd src-tauri && cargo test migrations_fresh_db --verbose` | database | `.github/workflows/ci.yml` | Run the fresh-database migration guard test in CI. | Yes |
| `node scripts/anti-spaghetti-guards.js` | architecture | `.github/workflows/ci.yml` | Run anti-spaghetti architecture guards in CI. | Yes |
| `node scripts/architecture-check.js --strict \|\| true` | architecture | `.github/workflows/ci.yml` | Run the backend architecture audit in permissive CI mode because known debt is allowlisted in comments. | Yes |
| `node scripts/ci-type-drift-check.js \|\| true` | types | `.github/workflows/ci.yml` | Run the CI type-drift gate in permissive mode because the workflow notes existing debt. | Yes |
| `node scripts/detect-schema-drift.js` | database | `.github/workflows/ci.yml` | Run schema drift detection in CI. | Yes |
| `node scripts/enforce-backend-module-boundaries.js` | architecture | `.github/workflows/ci.yml` | Run backend module boundary enforcement in CI. | Yes |
| `sudo apt-get install -y libwebkit2gtk-4.1-dev libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev build-essential` | build | `.github/workflows/ci.yml` | Install Linux system libraries required for Tauri builds in CI. | No — modifies the host system and typically needs root. |
| `sudo apt-get update` | build | `.github/workflows/ci.yml` | Update Linux package indexes in the CI check/build jobs before installing Tauri system dependencies. | No — modifies the host system and typically needs root. |
| `cd frontend && npm ci` | frontend | `.github/workflows/copilot-setup-steps.yml` | Install frontend dependencies in the Copilot setup workflow. | Yes |
| `npm ci` | dev | `.github/workflows/copilot-setup-steps.yml` | Install root workspace dependencies in the Copilot setup workflow. | Yes |
| `sudo apt-get install -y libwebkit2gtk-4.1-dev libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev build-essential` | build | `.github/workflows/copilot-setup-steps.yml` | Install Linux system libraries required for Tauri in the Copilot setup workflow. | No — modifies the host system and typically needs root. |
| `sudo apt-get update` | build | `.github/workflows/copilot-setup-steps.yml` | Update Linux package indexes before installing Tauri system dependencies for Copilot setup. | No — modifies the host system and typically needs root. |
| `make build` | backend | `Makefile` | Build the Rust backend with cargo build. | Yes |
| `make clean` | backend | `Makefile` | Clean Rust build artifacts. | Yes |
| `make format` | backend | `Makefile` | Run cargo fmt. | Yes |
| `make help` | dev | `Makefile` | Print the available Makefile commands. | Yes |
| `make lint` | backend | `Makefile` | Run cargo clippy with warnings denied. | Yes |
| `make test` | test | `Makefile` | Run all backend Rust tests. | Yes |
| `make test-auth-commands` | test | `Makefile` | Run only the auth command integration tests. | Yes |
| `make test-client-commands` | test | `Makefile` | Run only the client command integration tests. | Yes |
| `make test-commands` | test | `Makefile` | Run the core command integration test binaries. | Yes |
| `make test-intervention-cmds` | test | `Makefile` | Run only the intervention command integration tests. | Yes |
| `make test-task-commands` | test | `Makefile` | Run only the task command integration tests. | Yes |
| `make test-user-commands` | test | `Makefile` | Run only the user command integration tests. | Yes |
| `cd frontend && npm run analyze` | build | `frontend/package.json` | Build the frontend and open bundle analyzer output. Exact script: `npm run build && npx @next/bundle-analyzer` | Yes |
| `cd frontend && npm run arch:check` | architecture | `frontend/package.json` | Run the frontend architecture-check script. Exact script: `node scripts/architecture-check.cjs` | Yes |
| `cd frontend && npm run build` | build | `frontend/package.json` | Build the Next.js frontend for production. Exact script: `next build` | Yes |
| `cd frontend && npm run build:analyze` | build | `frontend/package.json` | Build the frontend with bundle analysis enabled. Exact script: `ANALYZE=true next build` | Yes |
| `cd frontend && npm run dev` | frontend | `frontend/package.json` | Start the Next.js development server. Exact script: `next dev` | Yes |
| `cd frontend && npm run dev:next` | frontend | `frontend/package.json` | Start the Next.js development server (alias). Exact script: `next dev` | Yes |
| `cd frontend && npm run encoding:check` | frontend | `frontend/package.json` | Scan `src/` for mojibake/encoding issues. Exact script: `node ../scripts/check-mojibake.js src` | Yes |
| `cd frontend && npm run lint` | frontend | `frontend/package.json` | Run ESLint across the frontend workspace. Exact script: `eslint . --ext .ts,.tsx --max-warnings 10000` | Yes |
| `cd frontend && npm run prebuild` | frontend | `frontend/package.json` | Regenerate types before build unless CI=true. Exact script: `node -e "if(process.env.CI !== 'true') require('child_process').execSync('npm run types:sync', {stdio:'inherit'})"` | Yes |
| `cd frontend && npm run predev` | frontend | `frontend/package.json` | Run frontend type generation before `npm run dev`. Exact script: `npm run types:sync` | Yes |
| `cd frontend && npm run prod:gate` | build | `frontend/package.json` | Run the frontend production gate: lint, type-check, architecture, and CI tests. Exact script: `npm run lint && npm run type-check && npm run arch:check && npm run test:ci` | Yes |
| `cd frontend && npm run start` | build | `frontend/package.json` | Start the built Next.js application. Exact script: `next start` | Yes |
| `cd frontend && npm run tauri` | frontend | `frontend/package.json` | Expose the Tauri CLI in the frontend workspace. Exact script: `tauri` | Yes |
| `cd frontend && npm run test` | test | `frontend/package.json` | Run the frontend Jest suite. Exact script: `jest` | Yes |
| `cd frontend && npm run test:ci` | test | `frontend/package.json` | Run Jest once for CI with coverage and passWithNoTests. Exact script: `jest --coverage --watchAll=false --passWithNoTests` | Yes |
| `cd frontend && npm run test:components` | test | `frontend/package.json` | Run component-focused Jest tests. Exact script: `jest --testPathPattern=src/components/**/__tests__` | Yes |
| `cd frontend && npm run test:coverage` | test | `frontend/package.json` | Run Jest and generate a coverage report. Exact script: `jest --coverage` | Yes |
| `cd frontend && npm run test:coverage:check` | test | `frontend/package.json` | Run Jest coverage with explicit global thresholds. Exact script: `jest --coverage --coverageThreshold='{"global":{"branches":70,"functions":70,"lines":70,"statements":70}}' --watchAll=false` | Yes |
| `cd frontend && npm run test:debug` | test | `frontend/package.json` | Start Jest under the Node inspector. Exact script: `node --inspect-brk node_modules/.bin/jest --runInBand` | Yes |
| `cd frontend && npm run test:e2e` | test | `frontend/package.json` | Run the Playwright end-to-end suite. Exact script: `playwright test` | Yes |
| `cd frontend && npm run test:e2e:client-lifecycle` | test | `frontend/package.json` | Run the Playwright client-lifecycle spec only. Exact script: `playwright test client-lifecycle.spec.ts` | Yes |
| `cd frontend && npm run test:e2e:codegen` | test | `frontend/package.json` | Open Playwright codegen. Exact script: `playwright codegen` | Yes |
| `cd frontend && npm run test:e2e:debug` | test | `frontend/package.json` | Run Playwright in debug mode. Exact script: `playwright test --debug` | Yes |
| `cd frontend && npm run test:e2e:ui` | test | `frontend/package.json` | Open Playwright UI mode. Exact script: `playwright test --ui` | Yes |
| `cd frontend && npm run test:hooks` | test | `frontend/package.json` | Run hook-focused Jest tests. Exact script: `jest --testPathPattern=src/hooks/**/__tests__` | Yes |
| `cd frontend && npm run test:integration` | test | `frontend/package.json` | Run integration-style Jest tests. Exact script: `jest --testPathPattern=src/**/integration.test.{ts,tsx}` | Yes |
| `cd frontend && npm run test:watch` | test | `frontend/package.json` | Run Jest in watch mode. Exact script: `jest --watch` | Yes |
| `cd frontend && npm run type-check` | frontend | `frontend/package.json` | Run `tsc --noEmit` in the frontend workspace. Exact script: `tsc --noEmit` | Yes |
| `cd frontend && npm run types:sync` | types | `frontend/package.json` | Run the Rust type exporter and write frontend bindings. Exact script: `cd ../src-tauri && cargo run --bin export-types \| node ../scripts/write-types.js` | Yes |
| `npm run architecture:check` | architecture | `package.json` | Run backend architecture checks plus anti-spaghetti guards. Exact script: `node scripts/architecture-check.js --strict && node scripts/anti-spaghetti-guards.js` | Yes |
| `npm run architecture:check:strict` | architecture | `package.json` | Run backend architecture checks plus strict anti-spaghetti guards. Exact script: `node scripts/architecture-check.js --strict && node scripts/anti-spaghetti-guards.js --strict` | Yes |
| `npm run backend:architecture-check` | backend | `package.json` | Run the backend IPC/architecture gate. Exact script: `node scripts/backend-architecture-check.js` | Yes |
| `npm run backend:boundaries:check` | backend | `package.json` | Enforce backend module boundary rules. Exact script: `node scripts/enforce-backend-module-boundaries.js` | Yes |
| `npm run backend:build` | backend | `package.json` | Build the Rust/Tauri backend. Exact script: `cd src-tauri && cargo build` | Yes |
| `npm run backend:build:release` | backend | `package.json` | Build the Rust/Tauri backend in release mode. Exact script: `cd src-tauri && cargo build --release` | Yes |
| `npm run backend:check` | backend | `package.json` | Create a placeholder frontend build directory and run cargo check. Exact script: `node -e "require('fs').mkdirSync('frontend/.next', { recursive: true })" && cd src-tauri && cargo check` | Yes |
| `npm run backend:clippy` | backend | `package.json` | Create a placeholder frontend build directory and run cargo clippy. Exact script: `node -e "require('fs').mkdirSync('frontend/.next', { recursive: true })" && cd src-tauri && cargo clippy` | Yes |
| `npm run backend:detect-cross-domain` | backend | `package.json` | Detect backend cross-domain imports outside tests. Exact script: `node scripts/detect-cross-domain-imports.js` | Yes |
| `npm run backend:detect-cross-domain:all` | backend | `package.json` | Detect backend cross-domain imports including tests. Exact script: `node scripts/detect-cross-domain-imports.js --include-tests` | Yes |
| `npm run backend:detect-unused-mods` | backend | `package.json` | Attempt to run a missing unused Rust module detector. Exact script: `node scripts/detect-unused-rust-mods.js` | No — references a missing script file. |
| `npm run backend:fmt` | backend | `package.json` | Format Rust sources with cargo fmt. Exact script: `cd src-tauri && cargo fmt` | Yes |
| `npm run backend:migration:fresh-db-test` | database | `package.json` | Run the fresh-database migration smoke test in Rust. Exact script: `cd src-tauri && cargo test smoke_migration_harness_full --lib` | Yes |
| `npm run boundary:enforce` | architecture | `package.json` | Enforce frontend boundary coverage rules. Exact script: `node scripts/boundary-coverage-enforce.js --strict` | Yes |
| `npm run boundary:enforce:strict` | architecture | `package.json` | Enforce frontend boundary coverage rules in strict mode. Exact script: `node scripts/boundary-coverage-enforce.js --strict` | Yes |
| `npm run boundary:report` | architecture | `package.json` | Print the frontend boundary coverage report. Exact script: `node scripts/boundary-coverage-report.js --strict` | Yes |
| `npm run boundary:report:strict` | architecture | `package.json` | Print the frontend boundary coverage report in strict mode. Exact script: `node scripts/boundary-coverage-report.js --strict` | Yes |
| `npm run build` | build | `package.json` | Regenerate types, then build the Tauri application. Exact script: `npm run types:sync && npm run tauri build` | Yes |
| `npm run bundle:analyze` | build | `package.json` | Run a frontend build with bundle analysis enabled. Exact script: `cd frontend && ANALYZE=true npm run build` | Yes |
| `npm run bundle:check-size` | build | `package.json` | Inspect the built frontend bundle size report. Exact script: `node scripts/check-bundle-size.js` | Yes |
| `npm run ci:validate` | types | `package.json` | Run the CI shell validation for generated type artifacts. Exact script: `bash scripts/ci-type-check.sh` | Yes |
| `npm run clean` | dev | `package.json` | Remove frontend build artifacts and run cargo clean. Exact script: `npm run frontend:clean && cd src-tauri && cargo clean` | Yes |
| `npm run code-review:check` | dev | `package.json` | Attempt to run a missing code review helper script. Exact script: `node scripts/code-review-check.js` | No — references a missing script file. |
| `npm run complexity:enforce` | architecture | `package.json` | Enforce maintainability complexity limits. Exact script: `node scripts/enforce-complexity-rules.js` | Yes |
| `npm run db:repair-signup-trigger` | database | `package.json` | Attempt to run a missing signup-trigger repair script. Exact script: `node scripts/repair_user_signup_trigger.js` | No — references a missing script file. |
| `npm run dev` | dev | `package.json` | Start Tauri development mode through the root wrapper. Exact script: `npm run tauri dev` | Yes |
| `npm run dev:strict` | dev | `package.json` | Regenerate types, run drift check, then start Tauri development mode. Exact script: `npm run types:sync && npm run types:drift-check && npm run tauri dev` | Yes |
| `npm run dev:types` | dev | `package.json` | Regenerate shared types, then start Tauri development mode. Exact script: `npm run types:sync && npm run tauri dev` | Yes |
| `npm run duplication:detect` | dev | `package.json` | Attempt to run a missing duplication detection script. Exact script: `node scripts/detect-duplication.js` | No — references a missing script file. |
| `npm run fix:encoding` | dev | `package.json` | Rewrite mojibake-corrupted frontend files in place. Exact script: `node scripts/fix-encoding.js` | Yes |
| `npm run frontend:build` | frontend | `package.json` | Build the frontend workspace. Exact script: `cd frontend && npm run build` | Yes |
| `npm run frontend:clean` | frontend | `package.json` | Remove frontend node_modules and build outputs. Exact script: `cd frontend && rm -rf node_modules .next out` | Yes |
| `npm run frontend:dev` | frontend | `package.json` | Start the Next.js frontend workspace dev server. Exact script: `cd frontend && npm run dev` | Yes |
| `npm run frontend:encoding-check` | frontend | `package.json` | Scan frontend sources for mojibake/encoding issues. Exact script: `cd frontend && npm run encoding:check` | Yes |
| `npm run frontend:install` | frontend | `package.json` | Install frontend workspace dependencies with npm. Exact script: `cd frontend && npm install` | Yes |
| `npm run frontend:lint` | frontend | `package.json` | Run frontend ESLint checks. Exact script: `cd frontend && npm run lint` | Yes |
| `npm run frontend:type-check` | frontend | `package.json` | Run the frontend TypeScript compiler without emitting files. Exact script: `cd frontend && npm run type-check` | Yes |
| `npm run git:cleanup-feature` | dev | `package.json` | Delete/sync branches using the scripted Git workflow. Exact script: `node scripts/git-workflow.js cleanup-feature` | Yes |
| `npm run git:finish-feature` | dev | `package.json` | Run the scripted feature-finish workflow. Exact script: `node scripts/git-workflow.js finish-feature` | Yes |
| `npm run git:guard-main` | dev | `package.json` | Refuse unsafe operations against main from the scripted Git workflow. Exact script: `node scripts/git-workflow.js guard-main` | Yes |
| `npm run git:start-feature` | dev | `package.json` | Create a feature branch using the scripted Git workflow. Exact script: `node scripts/git-workflow.js start-feature` | Yes |
| `npm run git:sync-feature` | dev | `package.json` | Rebase/sync the current feature branch using the scripted Git workflow. Exact script: `node scripts/git-workflow.js sync-feature` | Yes |
| `npm run install` | dev | `package.json` | Install frontend dependencies through the root wrapper. Exact script: `npm run frontend:install` | Yes |
| `npm run ipc:consistency-check` | security | `package.json` | Compare backend IPC registrations with the frontend command registry. Exact script: `node scripts/ipc-consistency-check.js` | Yes |
| `npm run ipc:production-gate` | security | `package.json` | Run the IPC production/security gate. Exact script: `node scripts/ipc-production-gate.js` | Yes |
| `npm run maintainability:audit` | architecture | `package.json` | Generate the maintainability audit report. Exact script: `node scripts/maintainability-audit.js` | Yes |
| `npm run maintainability:audit:strict` | architecture | `package.json` | Generate the maintainability audit in strict mode. Exact script: `node scripts/maintainability-audit.js --strict` | Yes |
| `npm run migration:audit` | architecture | `package.json` | Audit bounded-context migration progress. Exact script: `node scripts/bounded-context-migration-audit.js --strict` | Yes |
| `npm run migration:audit:strict` | architecture | `package.json` | Audit bounded-context migration progress in strict mode. Exact script: `node scripts/bounded-context-migration-audit.js --strict` | Yes |
| `npm run performance:test` | test | `package.json` | Attempt to run a missing performance regression script. Exact script: `node scripts/performance-regression-test.js` | No — references a missing script file. |
| `npm run performance:update-baseline` | test | `package.json` | Attempt to update performance baselines via a missing script. Exact script: `node scripts/performance-regression-test.js --update-baseline` | No — references a missing script file. |
| `npm run prepare` | dev | `package.json` | Install Husky Git hooks after dependency installation. Exact script: `husky` | Yes |
| `npm run prod:gate` | build | `package.json` | Run the production gate: format, clippy, tests, IPC gate, and migration smoke test. Exact script: `cd src-tauri && cargo fmt --check && cargo clippy -- -D warnings && cargo test && cd .. && node scripts/backend-architecture-check.js && node scripts/ipc-production-gate.js && npm run backend:migration:fresh-db-test` | Yes |
| `npm run quality:check` | build | `package.json` | Run the repository quality gate chain of lint, type, boundary, backend, and architecture checks. Exact script: `npm run frontend:lint && npm run frontend:type-check && npm run boundary:enforce && npm run validate:bounded-contexts && npm run backend:check && npm run backend:clippy && npm run backend:fmt -- --check && npm run architecture:check && npm run backend:boundaries:check && npm run migration:audit && npm run complexity:enforce` | Yes |
| `npm run security:audit` | security | `package.json` | Run the repository security audit script. Exact script: `node scripts/security-audit.js` | Yes |
| `npm run tauri` | dev | `package.json` | Expose the Tauri CLI from the root package. Exact script: `tauri` | Yes |
| `npm run types:ci-drift-check` | types | `package.json` | Run the stricter CI drift check workflow locally. Exact script: `node scripts/ci-type-drift-check.js` | Yes |
| `npm run types:drift-check` | types | `package.json` | Detect drift between Rust models and TypeScript types. Exact script: `node scripts/check-type-drift.js` | Yes |
| `npm run types:generate-docs` | types | `package.json` | Attempt to generate type documentation via a missing script file. Exact script: `node scripts/generate-type-docs.js` | No — references a missing script file. |
| `npm run types:sync` | types | `package.json` | Run the Rust export-types binary and write generated frontend bindings. Exact script: `cd src-tauri && cargo run --features export-types --bin export-types \| node ../scripts/write-types.js` | Yes |
| `npm run types:validate` | types | `package.json` | Validate generated/shared frontend type exports. Exact script: `node scripts/validate-types.js` | Yes |
| `npm run types:watch` | types | `package.json` | Watch Rust source files and rerun type generation on change. Exact script: `node scripts/watch-types.js` | Yes |
| `npm run validate:architecture` | architecture | `package.json` | Run the frontend bounded-context validator in strict mode. Exact script: `node scripts/validate-bounded-contexts.js --strict` | Yes |
| `npm run validate:bounded-contexts` | architecture | `package.json` | Run the frontend bounded-context validator in strict mode. Exact script: `node scripts/validate-bounded-contexts.js --strict` | Yes |
| `npm run validate:bounded-contexts:strict` | architecture | `package.json` | Run the frontend bounded-context validator in strict mode. Exact script: `node scripts/validate-bounded-contexts.js --strict` | Yes |
| `node scripts/anti-spaghetti-guards.js` | architecture | `scripts/anti-spaghetti-guards.js` | Scan frontend/backend source for anti-spaghetti architecture violations; add `--strict` for stricter checks. | Yes |
| `node scripts/architecture-check.js` | architecture | `scripts/architecture-check.js` | Run the backend bounded-context architecture audit; add `--strict` to tighten checks. | Yes |
| `node scripts/backend-architecture-check.js` | architecture | `scripts/backend-architecture-check.js` | Run the strict backend IPC/SQL/cross-domain architecture gate. | Yes |
| `node scripts/boundary-coverage-enforce.js` | architecture | `scripts/boundary-coverage-enforce.js` | Enforce frontend boundary coverage rules against the allowlist; add `--strict` to disable grandfathering. | Yes |
| `node scripts/boundary-coverage-report.js` | architecture | `scripts/boundary-coverage-report.js` | Print the frontend boundary coverage report collected from `frontend/src`. | Yes |
| `node scripts/bounded-context-migration-audit.js` | architecture | `scripts/bounded-context-migration-audit.js` | Audit legacy-vs-bounded-context migration progress; add `--strict` to fail on remaining debt. | Yes |
| `node scripts/check-bundle-size.js` | build | `scripts/check-bundle-size.js` | Inspect `frontend/.next` output size and highlight large bundles. | Yes — requires an existing frontend build. |
| `node scripts/check-mojibake.js [path]` | frontend | `scripts/check-mojibake.js` | Scan a path (default `frontend/src`) for mojibake patterns and rewrite affected files in place. | Yes |
| `node scripts/check-type-drift.js` | types | `scripts/check-type-drift.js` | Compare Rust models with generated/manual TypeScript types and write a drift report. | Yes |
| `bash scripts/ci-type-check.sh` | types | `scripts/ci-type-check.sh` | Run the shell-based CI validation for generated type files and required exports. | Yes |
| `node scripts/ci-type-drift-check.js` | types | `scripts/ci-type-drift-check.js` | Regenerate types, diff them, and run frontend type-check as a CI drift gate. | Yes |
| `node scripts/detect-cross-domain-imports.js` | architecture | `scripts/detect-cross-domain-imports.js` | Detect backend cross-domain internal imports; add `--include-tests` to scan tests too. | Yes |
| `node scripts/detect-schema-drift.js` | database | `scripts/detect-schema-drift.js` | Inspect `schema.sql` for missing indexes, foreign keys, and required columns. | Yes |
| `node scripts/enforce-backend-module-boundaries.js` | architecture | `scripts/enforce-backend-module-boundaries.js` | Enforce backend module boundary and IPC/infrastructure separation rules. | Yes |
| `node scripts/enforce-complexity-rules.js` | architecture | `scripts/enforce-complexity-rules.js` | Fail on new oversized or mixed-responsibility Rust/TypeScript files. | Yes |
| `node --test scripts/enforce-complexity-rules.test.js` | test | `scripts/enforce-complexity-rules.test.js` | Run the node:test suite covering the complexity enforcement script. | Yes |
| `node scripts/fix-encoding.js` | frontend | `scripts/fix-encoding.js` | Scan `frontend/src` and rewrite mojibake-corrupted `.ts`/`.tsx` files. | Yes |
| `node scripts/git-workflow.js <command>` | dev | `scripts/git-workflow.js` | Run the scripted Git workflow helper (`start-feature`, `sync-feature`, `finish-feature`, `cleanup-feature`, `guard-main`). | Yes |
| `node scripts/ipc-authorization-audit.js` | security | `scripts/ipc-authorization-audit.js` | Audit Tauri commands for missing authorization/session checks. | Yes |
| `node scripts/ipc-consistency-check.js` | security | `scripts/ipc-consistency-check.js` | Compare backend IPC registrations against the frontend command registry. | Yes |
| `node scripts/ipc-production-gate.js` | security | `scripts/ipc-production-gate.js` | Run the strict IPC production/security gate. | Yes |
| `node scripts/maintainability-audit.js` | architecture | `scripts/maintainability-audit.js` | Generate the maintainability audit report for Rust and TypeScript code. | Yes |
| `node --test scripts/maintainability-audit.test.js` | test | `scripts/maintainability-audit.test.js` | Run the node:test suite covering the maintainability audit helpers. | Yes |
| `node scripts/migration-health-check.js` | database | `scripts/migration-health-check.js` | Inspect migration files, stored test results, DB freshness markers, and dependency gaps. | Yes |
| `node scripts/security-audit.js` | security | `scripts/security-audit.js` | Run environment, dependency, configuration, and build security checks. | Yes |
| `bash scripts/test-health-check.sh` | test | `scripts/test-health-check.sh` | Audit backend/frontend test health, structure, coverage, and common smells. | Yes |
| `node scripts/test-migrations.js` | database | `scripts/test-migrations.js` | Validate SQL migration syntax and create migration snapshots/results. | Yes |
| `node scripts/validate-bounded-contexts.js` | architecture | `scripts/validate-bounded-contexts.js` | Validate frontend bounded-context rules; add `--strict` for the strict mode rule set. | Yes |
| `node scripts/validate-migration-system.js` | database | `scripts/validate-migration-system.js` | Validate migration filenames, schema constraints, and fresh-DB migration tests. | Yes |
| `node scripts/validate-types.js` | types | `scripts/validate-types.js` | Validate required generated/shared type exports and heuristics. | Yes |
| `node scripts/watch-types.js` | types | `scripts/watch-types.js` | Watch Rust source trees and rerun `npm run types:sync` when they change. | Yes — long-running watcher. |
| `cd src-tauri && cargo run --features export-types --bin export-types \| node scripts/write-types.js` | types | `scripts/write-types.js` | Consume exported TypeScript definitions from stdin and write `frontend/src/lib/backend/*` outputs. | Yes |
| `cd src-tauri && cargo bench --bench audit_benchmarks` | test | `src-tauri/Cargo.toml` | Run the audit performance benchmark target. | Yes |
| `cd src-tauri && cargo bench --bench intervention_benchmarks` | test | `src-tauri/Cargo.toml` | Run the intervention performance benchmark target. | Yes |
| `cd src-tauri && cargo bench --bench task_benchmarks` | test | `src-tauri/Cargo.toml` | Run the task performance benchmark target. | Yes |
| `cd src-tauri && cargo run --bin main` | backend | `src-tauri/Cargo.toml` | Run the default Tauri binary declared in Cargo. | Yes |
| `cd src-tauri && cargo run --features export-types --bin export-types` | types | `src-tauri/Cargo.toml` | Run the Rust binary that emits TypeScript bindings for `scripts/write-types.js`. | Yes |
| `cd src-tauri && cargo test --test auth_commands_test` | test | `src-tauri/Cargo.toml` | Run the auth IPC integration test target. | Yes |
| `cd src-tauri && cargo test --test client_commands_test` | test | `src-tauri/Cargo.toml` | Run the client IPC integration test target. | Yes |
| `cd src-tauri && cargo test --test golden_flows_test` | test | `src-tauri/Cargo.toml` | Run the golden-flow integration test target. | Yes |
| `cd src-tauri && cargo test --test intervention_commands_test` | test | `src-tauri/Cargo.toml` | Run the intervention IPC integration test target. | Yes |
| `cd src-tauri && cargo test --test inventory_commands_test` | test | `src-tauri/Cargo.toml` | Run the inventory command integration test target. | Yes |
| `cd src-tauri && cargo test --test ipc_contract_test` | test | `src-tauri/Cargo.toml` | Run the IPC contract integration test target. | Yes |
| `cd src-tauri && cargo test --test quote_commands_test` | test | `src-tauri/Cargo.toml` | Run the quote command integration test target. | Yes |
| `cd src-tauri && cargo test --test task_commands_test` | test | `src-tauri/Cargo.toml` | Run the task IPC integration test target. | Yes |
| `cd src-tauri && cargo test --test user_commands_test` | test | `src-tauri/Cargo.toml` | Run the user IPC integration test target. | Yes |

## B. Script File Inventory

| Filename | Inputs | Outputs | Fails when | Dependencies |
| --- | --- | --- | --- | --- |
| anti-spaghetti-guards.js | `--strict` flag. | Prints frontend/backend architecture violations; exits non-zero on violations. | Any non-allowlisted violation is found. | Node fs/path only. |
| architecture-check.js | `--strict`; `BOUNDED_CONTEXT_STRICT`; `scripts/architecture-allowlist.json`. | Reports backend bounded-context violations; exits 1 on new/strict violations. | New non-allowlisted violations or strict-mode failures. | Reads source files plus `architecture-allowlist.json`. |
| backend-architecture-check.js | `scripts/backend-architecture-allowlist.json`. | Prints IPC SQL/DB/cross-domain violations; exits 1 when any remain. | SQL/DB usage in IPC or forbidden cross-domain imports are found. | Reads backend sources plus `backend-architecture-allowlist.json`. |
| boundary-coverage-enforce.js | `--strict`; `BOUNDED_CONTEXT_STRICT`; `scripts/boundary-coverage-allowlist.json`. | Prints the frontend boundary report and exits 1 on new violations. | Non-allowlisted boundary violations are found. | Calls `boundary-coverage-report.js` and reads `boundary-coverage-allowlist.json`. |
| boundary-coverage-report.js | No CLI args used in-package; honors `--strict`/`BOUNDED_CONTEXT_STRICT` when run directly. | Collects and optionally prints frontend boundary violation objects. | Does not fail by itself when imported; direct CLI mode just reports. | Scans `frontend/src` with Node fs/path. |
| bounded-context-migration-audit.js | `--strict`. | Prints migration-progress counts/samples; strict mode exits non-zero. | Strict mode finds remaining legacy shims/scaffolds/imports. | Node fs/path only. |
| check-bundle-size.js | No args; expects `frontend/.next` to exist. | Prints bundle-size totals/chunk warnings. | The build directory is missing. | Reads built Next.js output from `frontend/.next`. |
| check-mojibake.js | Optional path argument (`process.argv[2]`), defaulting to `frontend/src`. | Reports replacements and rewrites affected files in place. | Invalid UTF-8 or unreadable input causes an error exit. | Node fs/path/TextDecoder. |
| check-type-drift.js | No args. | Writes `scripts/type-drift-report.json` and prints drift summary. | The report status is FAIL / required files are missing. | Reads Rust files and frontend type files. |
| ci-type-check.sh | No args; uses hardcoded frontend type paths. | Checks for generated type files/exports and prints colored CI status. | `backend.ts` or required exports are missing. | bash, grep, and the frontend generated type files. |
| ci-type-drift-check.js | Uses `CI`; no positional args. | Writes `type-drift-ci-report.json`, prints diffs, and cleans temp files. | Generated types are missing/empty, drift is detected, or frontend type-check fails. | Runs `cargo run --bin export-types` and `cd frontend && npm run type-check`. |
| detect-cross-domain-imports.js | `--include-tests` flag. | Prints forbidden cross-domain Rust imports and exits non-zero when present. | A matching forbidden import is found. | Node fs/path only. |
| detect-schema-drift.js | No args; reads `src-tauri/src/db/schema.sql`. | Writes `migration-tests/results/schema-drift-*.json` and prints severity-ranked findings. | Critical/high schema drift issues are detected. | Reads schema SQL via Node fs/path. |
| enforce-backend-module-boundaries.js | `scripts/backend-boundary-allowlist.json`. | Prints backend module-boundary violations and exits 1 on failures. | A non-allowlisted backend boundary violation is found. | Reads backend sources plus `backend-boundary-allowlist.json`. |
| enforce-complexity-rules.js | `scripts/complexity-allowlist.json` plus optional `PROJECT_ROOT` in tests. | Prints FORCE SPLIT / FORCE REFACTOR findings and exits 1 on new violations. | A non-allowlisted complexity violation is found. | Imports `maintainability-audit.js` and reads `complexity-allowlist.json`. |
| enforce-complexity-rules.test.js | No CLI args; runs under `node --test`. | Executes node:test coverage for `enforce-complexity-rules.js`. | Any node:test assertion fails. | Uses `node:test`, temp files, and spawns the enforcement script. |
| fix-encoding.js | No args. | Scans `frontend/src`, rewrites mojibake matches, and prints a summary. | File IO errors occur during scanning or writing. | Node fs/path only. |
| git-workflow.js | Subcommand plus optional branch/base args. | Runs Git workflow helpers and prints guidance/errors. | Repo-state checks fail or the underlying `git` command fails. | Spawns `git` via `child_process`. |
| ipc-authorization-audit.js | No args. | Prints IPC authorization findings and exits 1 on unauthorized commands. | A protected command lacks required auth/session patterns. | Scans Tauri command files with Node fs/path. |
| ipc-consistency-check.js | No args. | Compares backend/frontend IPC command registries and exits on mismatches. | A backend-only or unsupported frontend-only command is found. | Reads `src-tauri/src/main.rs` and `frontend/src/lib/ipc/commands.ts`. |
| ipc-production-gate.js | No args. | Prints security/ADR compliance findings for IPC handlers and exits 1 on violations. | Critical IPC problems such as missing auth, SQL, unwrap/expect, or error leaks are found. | Scans IPC Rust files with Node fs/path. |
| maintainability-audit.js | Optional `--strict` flag is parsed by the script. | Writes `maintainability-report.json` and prints maintainability findings. | Returns exit 1 when invoked in strict/failing conditions. | Node fs/path plus its own exported analysis helpers. |
| maintainability-audit.test.js | No CLI args; runs under `node --test`. | Executes node:test assertions for the maintainability analysis helpers. | Any node:test assertion fails. | Uses `node:test` and imports `maintainability-audit.js`. |
| migration-health-check.js | No args; uses `APPDATA`/`HOME` to locate the local DB. | Writes `migration-tests/results/health-check-*.json` and prints migration health/recommendations. | Mostly warns instead of hard-failing; bad file/test state yields WARN/FAIL statuses in the report. | Reads migrations/results and shells only for stored test data access. |
| security-audit.js | Reads `JWT_SECRET` and `DATABASE_ENCRYPTION_KEY`. | Prints categorized security findings and exits 1 on critical/high issues. | Secrets/config are missing, clippy fails, or frontend build/type checks fail. | Runs `cargo clippy -- -D warnings` and `npm run build`. |
| test-health-check.sh | No args. | Prints test-health checks and recommendations for backend/frontend suites. | Mostly warns rather than hard-failing; shell command failures are reported in the output. | Uses bash, `cargo`, `npm`, `find`, `grep`, and optional `cargo llvm-cov`. |
| test-migrations.js | No args. | Creates migration snapshots/results under `migration-tests/` and prints SQL test results. | A migration SQL syntax check fails. | Reads migration files and writes `migration-tests/snapshots` + `migration-tests/results`. |
| validate-bounded-contexts.js | `--strict`; `BOUNDED_CONTEXT_STRICT`. | Prints frontend bounded-context rule violations and exits 1 on errors. | Any bounded-context rule fails. | Scans frontend domains and tsconfig aliases with Node fs/path. |
| validate-migration-system.js | No args. | Prints JSON validation output and exits 1 when migration/system checks fail. | Filename/schema checks fail or the fresh-DB cargo test command fails. | Runs `cargo test db::migrations::tests:: -- --test-threads=1`. |
| validate-types.js | No args. | Prints type-validation findings and exits non-zero on missing/invalid exports. | Expected generated types/exports are missing. | Reads generated frontend type files with Node fs/path. |
| watch-types.js | No args; long-running watcher. | Logs Rust file changes and reruns type generation until stopped. | The underlying `npm run types:sync` command fails. | Uses `fs.watch` and `npm run types:sync`. |
| write-types.js | Reads generated type definitions from stdin. | Writes/overwrites `frontend/src/lib/backend/*` outputs plus `backend.ts` stub. | Required exports are missing or file writes fail after retries. | Consumes stdin and writes generated type files. |

## C. Broken / Missing References

- Root `package.json` has seven scripts that point at files that do not exist: `types:generate-docs` → `scripts/generate-type-docs.js`, `performance:test` / `performance:update-baseline` → `scripts/performance-regression-test.js`, `duplication:detect` → `scripts/detect-duplication.js`, `backend:detect-unused-mods` → `scripts/detect-unused-rust-mods.js`, `code-review:check` → `scripts/code-review-check.js`, and `db:repair-signup-trigger` → `scripts/repair_user_signup_trigger.js`.
- `.github/PULL_REQUEST_TEMPLATE.md` asks contributors to verify `npm run test`, but the root `package.json` has no `test` script. The frontend tests live in `frontend/package.json` (`cd frontend && npm run test`) and backend tests are exposed via `make test` / `cargo test`.
- `scripts/migration-health-check.js` recommends `npm run migration:test`, but neither the root nor frontend `package.json` defines that script.
- Several docs still describe generated Rust→TypeScript output as living in `frontend/src/types/`, but the current generation pipeline (`types:sync` + `scripts/write-types.js`) writes to `frontend/src/lib/backend/` and a `frontend/src/lib/backend.ts` stub. Verified stale references: `README.md`, `docs/adr/009-type-synchronization.md`, and `docs/audit-configuration.md`.
- `scripts/` contains runnable utilities that are not exposed through root scripts: `enforce-complexity-rules.test.js`, `maintainability-audit.test.js`, `migration-health-check.js`, `test-health-check.sh`, and `test-migrations.js`.
- The workflow command `npm run tauri build -- --target ${{ matrix.target }}` in `.github/workflows/ci.yml` is not directly locally runnable because it depends on GitHub Actions matrix interpolation; it must be rewritten with a concrete target locally.
- The workflow apt-get setup commands are CI/bootstrap steps rather than normal project entry points and are not safe to run on most local developer machines without root privileges.
- No `justfile`, `Justfile`, `taskfile.yml`, or `Taskfile.yml` exists, so there are no additional task-runner commands beyond the sources listed above.
- Inside the script source tree, `TODO`/`FIXME`/`placeholder` strings appear only in rule logic or scanner text (for example `validate-bounded-contexts.js`, `architecture-check.js`, `migration-health-check.js`, and `test-health-check.sh`); there are no open developer TODO comments that describe unfinished script implementations.
- Recommended follow-up: either remove the seven broken root `package.json` script entries or restore the missing `scripts/*.js` files so the documented command surface matches the runnable one.

## D. Recommended AGENTS.MD / CLAUDE.MD Snippet

```md
## Commands

Use the real command surfaces below; do not invent a root `npm run test` shortcut.

- **App / dev:** `npm run dev`, `npm run dev:types`, `npm run frontend:dev`
- **Frontend checks:** `npm run frontend:lint`, `npm run frontend:type-check`, `cd frontend && npm run test:ci`, `cd frontend && npm run test:e2e`
- **Backend checks:** `npm run backend:check`, `npm run backend:clippy`, `npm run backend:fmt`, `make test`, `cd src-tauri && cargo test --test <target>`
- **Types:** `npm run types:sync`, `npm run types:validate`, `npm run types:drift-check`, `npm run types:watch`
- **Architecture / security:** `npm run validate:bounded-contexts`, `npm run architecture:check`, `npm run backend:boundaries:check`, `node scripts/ipc-authorization-audit.js`, `npm run ipc:consistency-check`, `npm run security:audit`
- **Database / migrations:** `node scripts/validate-migration-system.js`, `node scripts/detect-schema-drift.js`, `npm run backend:migration:fresh-db-test`
- **Reference:** the full verified registry, script inventory, and broken-reference list live in `docs/command-audit.md`.
```
