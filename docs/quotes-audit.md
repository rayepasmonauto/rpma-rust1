## 1. Scope & assumptions
**Expected behavior**
- Audit complete Quotes functionality (list/create/detail, IPC, backend services, schema) per project conventions.
- Identify missing pieces and inconsistencies with the stated requirements and PRDs.

**Observed implementation (evidence)**
- Frontend routes: `frontend/src/app/quotes/page.tsx`, `frontend/src/app/quotes/new/page.tsx`, `frontend/src/app/quotes/[id]/page.tsx`.
- Frontend domain: `frontend/src/domains/quotes/*` (hooks, IPC, components).
- Backend IPC: `src-tauri/src/domains/quotes/ipc/quote.rs`.
- Backend service/repo/models: `src-tauri/src/domains/quotes/infrastructure/quote.rs`, `src-tauri/src/domains/quotes/infrastructure/quote_repository.rs`, `src-tauri/src/domains/quotes/domain/models/quote.rs`.
- Embedded migrations (Tauri): `src-tauri/migrations/037_quotes.sql`, `047_add_quotes_missing_columns.sql`, `048_fix_quotes_status_constraint.sql`.
- Root migrations: `migrations/032_quote_discounts.sql`, `033_quote_attachments.sql`, `034_quote_sharing.sql`.
- PRD schema expectation: `docs/PRDs/DATABASE.md` (quotes + quote_shares).

**Gaps/risks**
- Functional gaps in create/detail/share flows (see sections below).

**Recommendations**
- Align frontend data contract with backend schema.
- Implement missing share/public view flows and fix data drift.

**Tests needed**
- E2E: list/create/detail/share/export flows.
- Integration: status transitions and schema integrity.

---

## 2. Functionality map (user actions → screens → commands → tables)
_Tables column lists the primary tables touched (not exhaustive of joins or cached reads)._

| User action | Screen/route | Frontend hook/component | IPC command | Backend service/repo | Tables |
|---|---|---|---|---|---|
| List quotes | `/quotes` | `useQuotesList`, `QuotesListTable` | `quote_list` | `QuoteService::list_quotes`, `QuoteRepository::list` | `quotes` |
| Search/filter | `/quotes` | `useQuotesList.updateFilters` | `quote_list` | `QuoteRepository::build_where_clause` | `quotes` |
| Create quote | `/quotes/new` | `useCreateQuote` | `quote_create` | `QuoteService::create_quote`, `QuoteRepository::create` | `quotes`, `quote_items` |
| View detail | `/quotes/[id]` | `useQuote`, `QuoteDetailPageContent` | `quote_get` | `QuoteRepository::find_by_id` | `quotes`, `quote_items` |
| Add item | `/quotes/[id]` | `useQuoteItems.addItem` | `quote_item_add` | `QuoteService::add_item` | `quote_items` |
| Update item | (not wired) | `useQuoteItems.updateItem` | `quote_item_update` | `QuoteService::update_item` | `quote_items` |
| Delete item | `/quotes/[id]` | `useQuoteItems.deleteItem` | `quote_item_delete` | `QuoteService::delete_item` | `quote_items` |
| Mark sent/accepted/rejected | `/quotes/[id]` | `useQuoteStatus` | `quote_mark_sent/accepted/rejected` | `QuoteService::mark_*` | `quotes` |
| Export PDF | `/quotes/[id]` | `useQuoteExportPdf` | `quote_export_pdf` | `generate_quote_pdf` | Filesystem (`app_data_dir/quotes`) |
| Attachments CRUD | `/quotes/[id]` | `QuoteImagesManager`, `QuoteDocumentsManager` | `quote_attachments_get/create/update/delete` | `QuoteService::create_attachment` | `quote_attachments` |
| Share link | `/quotes/[id]` | `QuoteShareDialog` (not wired) | `quote_generate_share_link`, `quote_revoke_share_link` | `QuoteService::generate_share_link` | `quotes.public_token` |
| Public view | (no route) | — | `quote_get_by_public_token` | `QuoteService::track_public_view` | `quotes` |

---

## 3. Data model & integrity audit
**Expected behavior**
- Tables: `quotes`, `quote_items`, `quote_attachments`, `quote_shares` with FK integrity and cascades.
- Status set includes `draft/sent/accepted/rejected/expired`, and discount/total fields in minor units.
- Soft delete via `quotes.deletedat`.

**Observed implementation**
- `quotes` and `quote_items` defined in `src-tauri/migrations/037_quotes.sql`.
- Attachments in `src-tauri/migrations/047_add_quotes_missing_columns.sql` and root `migrations/033_quote_attachments.sql`.
- Share token stored in `quotes.public_token` via `migrations/034_quote_sharing.sql`.
- No `quote_shares` table exists (PRD expects it).
- No `deleted_at` on `quotes`.

**Gaps/risks**
- **High:** `quote_shares` table missing vs PRD.
- **Medium:** No soft delete column (`deleted_at`) for quotes.
- **Low:** Frontend `QuoteAttachment` includes `include_in_invoice`, backend does not (type drift).

**Recommendations**
- Add `quote_shares` table or update PRD/architecture to treat `quotes.public_token` as source of truth.
- Add `deleted_at` to `quotes` if soft delete is required.
- Align frontend/backend attachment fields.

**Tests needed**
- Integration: migration test verifying `quote_shares` exists and constraints match PRD.
- Integration: delete/restore workflow once `deleted_at` is introduced.

---

## 4. Business rules & status lifecycle audit
**Expected behavior**
- Draft → Sent → Accepted/Rejected/Expired with enforced transitions.
- Expired based on `valid_until`.
- Converted status when quote becomes a task.

**Observed implementation**
- `mark_sent` only from draft; `mark_accepted` only from sent; `mark_rejected` from draft or sent.
- `valid_until` is stored but not used to expire quotes.
- `converted` status exists but is never set (acceptance leaves status = accepted).

**Gaps/risks**
- **Medium:** No expiry enforcement for `valid_until`.
- **Low:** `converted` status never set.

**Recommendations**
- Implement expiry check (scheduled job or query-time rule).
- Set `converted` when task creation succeeds.

**Tests needed**
- Integration: expired status enforced by date.
- Integration: accepted → converted (after task creation).

---

## 5. Security/RBAC & privacy audit
**Expected behavior**
- Protected operations require `session_token` and RBAC checks.
- Public share endpoints should not require internal sessions.
- Attachment paths must be sanitized and constrained.

**Observed implementation**
- IPC handlers use `authenticate!` and `QuotesFacade::check_permission`.
- Public endpoints (`quote_get_by_public_token`, `quote_customer_response`) still require session token.
- Attachments accept arbitrary `file_path` from client.

**Gaps/risks**
- **High:** Public share endpoints require auth; clients cannot use shared link.
- **High:** Attachment `file_path` not sanitized (path traversal risk).
- **Medium:** No share token expiry/max access enforcement.

**Recommendations**
- Remove session requirement on public endpoints; validate token only.
- Restrict file path to app-managed directories and sanitize inputs.
- Introduce expiry/max access logic (either in `quote_shares` or `quotes`).

**Tests needed**
- Integration: public share access without session token.
- Integration: invalid path rejected for attachment creation.

---

## 6. PDF/export/share/attachments audit
**Expected behavior**
- PDF export includes full data, proper formatting/locale, and handles errors.
- Share link is generated/revoked from UI and visible on a public route.
- Attachments persist reliably and are safe to access.

**Observed implementation**
- `quote_export_pdf` creates a minimal text-based PDF (`generate_quote_pdf`).
- Share dialog exists but does not call `onGenerateLink`/`onRevokeLink`.
- No `/share/quote/...` route implemented.
- Attachments stored using `URL.createObjectURL` (not persistent).

**Gaps/risks**
- **High:** Share flow not wired end-to-end.
- **Medium:** PDF lacks formatting and client details.
- **Medium:** Attachment persistence unreliable.

**Recommendations**
- Wire share dialog to IPC commands and implement public view route.
- Improve PDF generation (layout, locale, client data).
- Persist attachments to app data dir with safe paths.

**Tests needed**
- Integration: PDF export produces file with totals.
- E2E: generate share link → open link → revoke.

---

## 7. UX & error-handling audit
**Expected behavior**
- Quote routes protected by RBAC, consistent empty/loading/error states.
- Session expiry mid-flow should surface a safe error and redirect.

**Observed implementation**
- Minimal toast-based errors; no explicit session-expiry flow.
- List empty state exists, but pagination UI is missing.
- List uses `quote.title` which backend does not provide.

**Gaps/risks**
- **Medium:** Missing pagination controls despite API support.
- **Medium:** Title field mismatch (undefined in backend).
- **Low:** Client name not shown (only `client_id`).

**Recommendations**
- Add pagination UI and show valid-until/updated columns.
- Align displayed fields with backend or extend backend schema.
- Implement session-expiry handling in hooks/UI.

**Tests needed**
- E2E: list pagination/filter and empty state.
- E2E: session expiry mid-create shows error and redirects.

---

## 8. Performance/offline reliability audit
**Expected behavior**
- Offline-first operations should work locally.
- Totals and status updates should be transactional and consistent.
- Concurrency safe quote numbers.

**Observed implementation**
- Local SQLite usage aligns with offline-first.
- Quote number derived from `COUNT(*)` in `QuoteRepository::next_quote_number`.
- Totals recalculation not wrapped in a transaction.

**Gaps/risks**
- **Medium:** Quote number race condition under concurrent create.
- **Medium:** Totals could desync if partial update fails.

**Recommendations**
- Use a dedicated counter table with explicit write locking (e.g., `BEGIN IMMEDIATE`, `UPDATE counter SET value = value + 1`, then `SELECT value` in the same transaction) to preserve sequential numbering without races.
- If supported in the chosen SQLite version, `UPDATE ... RETURNING` can replace the separate `SELECT`.
- If AUTOINCREMENT-based numbering is acceptable for the business, document it and use it consistently.
- Wrap item + totals updates in a single transaction.

**Tests needed**
- Integration: concurrent create produces unique numbers.
- Integration: item add/delete keeps totals consistent.

---

## 9. Test plan (E2E + integration + unit)
**E2E**
- List filters + pagination + empty state.
- Create quote with vehicle + discount + valid_until.
- Generate share link → open public view → revoke.

**Integration (Rust)**
- Status transitions: draft → sent → accepted/rejected/expired.
- Attachment validation (MIME, size, safe path).
- Public share access without session token.

**Unit**
- Frontend `computeQuoteTotals` parity with backend `recalculate_totals`.
- Validation errors for qty <= 0 and invalid discount.

---

## 10. Findings backlog (prioritized)
| ID | Title | Severity | Area | Evidence | Recommendation | Tests |
|---|---|---|---|---|---|---|
| F-01 | `quote_shares` table missing | High | Data model | `docs/PRDs/DATABASE.md` | Add `quote_shares` or update PRD | Integration schema test |
| F-02 | Public share endpoints require auth | High | Security | `quote_get_by_public_token` uses `authenticate!` | Remove auth for public endpoints | Integration |
| F-03 | Share UI not wired to IPC | High | Share UX | `QuoteShareDialog` unused handlers | Wire to `quote_generate_share_link`/`revoke` | E2E |
| F-04 | Public share route missing | High | Share UX | no `/share/quote/...` route | Implement route | E2E |
| F-05 | “Send to client” not implemented | High | Share | `handleEmailQuote` toast only | Implement email/SMS/share | E2E |
| F-06 | Create ignores title/status/valid_until/discount/vehicle | High | Create | `NewQuotePage` payload | Persist all fields | Integration |
| F-07 | Quote list references `title` not in backend | Medium | List | `QuotesListTable` | Add title field or remove | E2E |
| F-08 | List shows client ID only | Medium | List | `QuotesListTable` | Display client name | E2E |
| F-09 | Valid-until/updated-at missing in list | Low | List | list columns | Add columns | E2E |
| F-10 | Pagination UI missing | Low | List | `useQuotesList` supports paging | Add UI | E2E |
| F-11 | List delete/duplicate/export are placeholders | Medium | List | `QuotesPage` handlers | Wire to IPC | E2E |
| F-12 | Detail metadata editing missing | Medium | Detail | read-only detail | Add edit form | E2E |
| F-13 | Item editing not supported | Medium | Detail | add/delete only | Add edit + IPC | E2E |
| F-14 | Item kind `label` missing | Low | Items | `QuoteItemKind` enum | Add `label` or update req | Unit |
| F-15 | Per-line tax unsupported in create UI | Medium | Taxes | global `taxRate` | Add per-line tax | Integration |
| F-16 | Discount not persisted on create | Medium | Discounts | create payload | Persist discount_type/value | Integration |
| F-17 | Rounding mismatch (UI round vs backend trunc) | Medium | Monetary | UI `Math.round` vs backend trunc | Align rounding | Unit |
| F-18 | Negative unit_price not validated | Low | Monetary | item validate only qty | Enforce unit_price >= 0 | Unit |
| F-19 | Quote number race condition | Medium | Concurrency | `next_quote_number` | See section 8 recommendation for counter table/locking | Integration |
| F-20 | Expired status not enforced | Medium | Lifecycle | no expiry logic | Implement expiry | Integration |
| F-21 | `converted` status never set | Low | Lifecycle | `mark_accepted` | Set converted | Integration |
| F-22 | Hard delete only | Medium | Data integrity | `delete` SQL | Add soft delete | Integration |
| F-23 | Attachments use object URLs | Medium | Attachments | `URL.createObjectURL` | Persist to disk | E2E |
| F-24 | Attachment path unsanitized | High | Security | `file_path` input | Sanitize/sandbox | Integration |
| F-25 | Attachment type drift (`include_in_invoice`) | Low | Types | frontend only | Align types | Unit |
| F-26 | Documents table not used | Medium | Attachments | `documents` table unused | Decide SOT | Integration |
| F-27 | PDF export minimal | Medium | Export | `generate_quote_pdf` | Improve layout/locale | Integration |
| F-28 | Audit logging incomplete | Medium | Audit | only accepted/rejected/converted events | Add audit events | Integration |

**Definition of Done (Quotes)**
- [ ] List shows quote number, client name, status, totals, valid-until, created/updated, pagination.
- [ ] Create persists client, vehicle, valid-until, items, discounts, taxes, notes/terms.
- [ ] Detail supports edit in draft, read-only in sent/accepted, correct status gating.
- [ ] Status transitions enforce lifecycle incl. expired + converted.
- [ ] Share link is public, expirable, revocable, and audited.
- [ ] Attachments are safely stored and persisted.
- [ ] Export PDF is complete and localized.
- [ ] Audit logs exist for create/update/delete/status/export/share.
- [ ] Tests pass for E2E + integration + unit scopes.

**Clarifying questions**
1. What is the expected tax model (single rate, per-line, multiple rates, exemptions)?
2. What currency/locale rules apply (EUR, rounding, VAT display)?
3. What does “Send to Client” mean (email, message, share link, or print workflow)?
4. Do quotes need to convert into tasks/invoices later?
5. Any compliance constraints (GDPR retention, audit retention, signature/acceptance proof)?
