# Targeted ADR-015 Contract Drift Fix Prompt

You are working inside the RPMA v2 repository.

Your task is to fix the specific frontend/backend IPC contract drift causing the current runtime errors, following ADR-015 (Type Generation via ts-rs), ADR-013 (IPC Wrapper Pattern), and the IPC contract rules.

## Scope
Focus only on these logged failures and the exact code paths that produce them:

- `updateuserpreferences`: invalid args, missing `preferences.emailNotifications`
- `quotelist`: invalid args, missing `request.pagination`
- `quotegetstats`: invalid args, missing top-level `request`

Do **not** work on unrelated UI issues, styling, refactors, or accessibility warnings.
Do **not** make broad repo-wide cleanup changes outside the affected contract chain.

## Objective
Trace each failing command end-to-end and patch the real contract mismatch between Rust DTOs, generated ts-rs types, frontend IPC wrappers, and React Query consumers.

## Required investigation
For each of the three failing commands:

1. Identify the Rust IPC handler signature and the exact request/response DTOs crossing the IPC boundary.
2. Verify those Rust DTOs are exported correctly for ts-rs (`derive(TS)`, `ts(export)` or project-equivalent pattern).
3. Check whether any Rust IPC-bound request/response types are missing from the export flow.
4. Find any handwritten or duplicated TypeScript interfaces/types that mirror those Rust DTOs.
5. Trace the frontend call chain from generated types -> domain IPC wrapper -> query/mutation hook -> calling consumer.
6. Confirm the wrapper payload shape exactly matches what the Rust command expects, including top-level envelopes such as `request` and nested required fields such as `preferences.emailNotifications` and `request.pagination`.
7. Check whether command return shapes are represented in generated types and consumed correctly.

## Patch requirements
Apply the smallest complete fix that resolves the three logged runtime errors.

### Backend / Rust
- Add or correct `ts-rs` exports on relevant IPC request/response DTOs.
- Ensure unexported IPC-bound structs/enums used by these commands are included in type generation.
- Do not redesign unrelated domain models.

### Frontend / TypeScript
- Remove duplicate handwritten TS types for the affected settings/quotes contracts when generated types should be used.
- Replace imports/usages with generated types from the repo’s generated types directory.
- Fix the affected IPC wrappers so they send the exact backend-required argument shape.
- Fix related React Query hooks or consumers only where needed to satisfy the real contract.
- Do not edit generated files by hand unless the repo explicitly expects generated outputs to be committed after regeneration.

## Regeneration and verification
After patching source files:

1. Regenerate TypeScript types using the repo’s existing type sync workflow.
2. Run the repo’s existing type validation and drift checks if present.
3. Run the smallest relevant verification already used by the repo for this area, such as typecheck, targeted tests, or a build assertion.
4. If the repo already has a pattern for a small verification test or assertion for IPC/type drift, add one only for these affected contracts.
5. Do not invent a new test framework or broad test suite.

## Constraints
- Follow ADR-015: generated frontend types come from Rust via ts-rs.
- Follow ADR-013: frontend must use typed domain IPC wrappers, not ad hoc invoke shapes.
- Follow the existing repo architecture and naming conventions.
- Keep the fix narrow and production-oriented.
- Preserve backward-compatible behavior unless the current behavior is clearly broken by contract drift.

## Deliverables
Return:

1. A concise summary of root causes for each of the three errors.
2. The list of changed source files.
3. The list of regenerated files, if any.
4. A brief verification summary showing what checks were run and their result.
5. A mapping from each runtime error to the exact file(s) patched.

## Success criteria
The work is successful only if all of the following are true:

- `updateuserpreferences` no longer fails because `preferences.emailNotifications` is missing.
- `quotelist` no longer fails because `request.pagination` is missing.
- `quotegetstats` no longer fails because the top-level `request` argument is missing.
- The affected frontend contracts use generated types where appropriate.
- The fix aligns with ADR-015 and ADR-013 rather than patching around the problem with loose typing.
