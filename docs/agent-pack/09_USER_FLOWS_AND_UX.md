---
title: "User Flows and UX"
summary: "Standard user journeys, design system rules, and interaction patterns."
read_when:
  - "Designing new UI screens"
  - "Implementing complex workflows"
  - "Reviewing UX consistency"
---

# 09. USER FLOWS AND UX

This guide summarizes the main user journeys and the UI rules that keep them consistent.

## Global UX Rules

- Use Tailwind and shadcn/ui primitives for standard surfaces.
- Use Zod plus react-hook-form for all forms.
- Use TanStack Query for backend data and Zustand only for shared UI state.
- Prefer step-by-step flows for intervention work on tablet-sized screens.
- Keep error messages sanitized and actionable.

## Authentication And Bootstrap

| Entry route | Key commands | Key states |
|---|---|---|
| `/login` | `auth_login`, `auth_validate_session`, `auth_logout` | loading, invalid credentials, session restored, unauthorized redirect |
| `/bootstrap-admin` | `has_admins`, `bootstrap_first_admin` | first-run check, bootstrap form, success redirect |
| `/unauthorized` | none | access denied, role mismatch |

Validation and errors:

- Login forms should validate locally before invoking IPC.
- Invalid sessions should redirect to `/login`.
- Bootstrap should only appear when no admin exists.

## Tasks And Scheduling

| Entry route | Key commands | Key states |
|---|---|---|
| `/tasks` | `task_list`, `task_create`, `task_update` | list, empty state, filters, pagination |
| `/tasks/[id]` | `task_get`, `task_checklist_items_get`, `get_task_history` | detail, history, checklist, loading |
| `/tasks/new` | `task_create`, `task_draft_save` | draft, validation errors, save success |
| `/tasks/[id]/edit` | `task_update`, `task_draft_save`, `task_draft_delete` | edit form, dirty state, conflict or validation errors |
| `/schedule` and `/` | `calendar_get_tasks`, `get_events`, `calendar_schedule_task` | day/week views, drag or click scheduling, conflict warnings |

Validation and errors:

- Required task fields should be blocked before submit.
- Status transitions should be validated by the backend state machine.
- Draft save should survive navigation and partial data entry.

## PPF Intervention Execution

| Entry route | Key commands | Key states |
|---|---|---|
| `/tasks/[id]/workflow/ppf` | `intervention_get_progress`, `intervention_start`, `intervention_advance_step`, `intervention_finalize` | active step, progress bar, completion gate |
| `/tasks/[id]/workflow/ppf/steps/[step]` | `intervention_get_step`, `intervention_save_step_progress` | step-specific form, photo prompts, validation state |

Validation and errors:

- Step changes should be explicit and visibly confirmed.
- Finalization should require all required step data.
- Material and photo submission should fail fast with inline feedback when the backend rejects the payload.

## Clients, Quotes, And Conversion

| Entry route | Key commands | Key states |
|---|---|---|
| `/clients` | `client_list`, `client_get_stats`, `client_search` | list, search results, empty state |
| `/clients/[id]` | `client_get`, `client_get_with_tasks` | detail, related tasks |
| `/clients/new` | `client_create` | create form, validation errors |
| `/quotes` | `quote_list`, `quote_get_stats` | list, status filters |
| `/quotes/new` | `quote_create` | create form, validation errors |
| `/quotes/[id]` | `quote_get`, `quote_item_add`, `quote_mark_sent`, `quote_mark_accepted`, `quote_convert_to_task` | edit, status changes, conversion success |

Validation and errors:

- Quote status changes should be reflected in the UI only after the backend confirms them.
- Conversion to task should surface any backend validation failure directly.

## Inventory And Documents

| Entry route | Key commands | Key states |
|---|---|---|
| `/inventory` | `material_list`, `inventory_get_dashboard_data` | list, low-stock alerts, expired items |
| `/inventory/[id]` or feature panels | `material_create`, `material_update_stock`, `material_record_consumption` | stock edit, consumption entry, error states |
| Intervention photo surfaces | `document_store_photo`, `document_get_photos`, `document_get_photo_data` | upload, preview, delete, metadata edit |
| Report surfaces | `report_generate`, `report_get_by_intervention`, `export_intervention_report` | generation, preview, failure states |

Validation and errors:

- Treat photo and report commands as potentially large or slow operations.
- Use progress or loading states rather than blocking the whole app.

## Admin, Users, Settings, Trash

| Entry route | Key commands | Key states |
|---|---|---|
| `/users` and `/staff` | `get_users`, `create_user`, `update_user`, `delete_user` | table, edit dialog, permission error |
| `/settings` | `get_app_settings`, `update_general_settings` | section navigation, saved state |
| `/settings/security` | `update_security_settings`, `get_active_sessions`, `revoke_session` | session list, revoke confirmation |
| `/settings/profile` | `get_user_settings`, `update_user_profile` | profile form, avatar upload |
| `/trash` | `list_trash`, `restore_entity`, `hard_delete_entity`, `empty_trash` | soft-delete list, recovery, destructive confirmation |
| `/dashboard` | `dashboard_get_stats`, `get_entity_counts`, `get_recent_activities` | summary cards, recent activity, placeholder handling |

Validation and errors:

- Admin-only destructive actions should require strong confirmations.
- Trash restore should preserve the original entity shape where possible.
- The current `dashboard_get_stats` and `get_recent_activities` UI surfaces should be treated carefully because the backend currently returns placeholder-style data for those commands.

## Navigation And Search

| Surface | Key commands | Notes |
|---|---|---|
| Global navigation | `navigation_update`, `navigation_go_back`, `navigation_go_forward`, `navigation_get_current`, `navigation_refresh` | Keep history state in sync with the shell |
| Search | `global_search` | Use for cross-domain lookup and quick jump UX |
| Shell actions | `ui_shell_open_url`, `ui_initiate_customer_call`, `ui_gps_get_current_position` | Keep user feedback explicit for OS-level actions |

## Design System Guardrails

- Prefer clear hierarchy, spacing, and contrast over dense screens.
- Use cards, sheets, dialogs, and toasts consistently.
- Keep destructive actions visually distinct.
- Use the existing theme tokens and component primitives instead of custom one-off styling.
- On mobile or tablet-sized intervention screens, keep controls large enough for touch.

