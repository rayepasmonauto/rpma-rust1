---
title: "User Flows and UX"
summary: "Standard user journeys, design system rules, and interaction patterns."
read_when:
  - "Designing new UI screens"
  - "Implementing complex workflows"
  - "Reviewing UX consistency"
---

# 09. USER FLOWS AND UX

This guide defines how users interact with RPMA v2 and the standards for UI/UX.

## Primary User Flows

### 1. Authentication Flow

| Step | Route | Commands |
|------|-------|----------|
| Login | `/login` | `auth_login` |
| Bootstrap admin | `/bootstrap-admin` | `bootstrap_first_admin` |
| Session validate | — | `auth_validate_session` |
| Logout | — | `auth_logout` |
| Unauthorized redirect | `/unauthorized` | — |

### 2. Client Management Flow

| Step | Route | Commands |
|------|-------|----------|
| List clients | `/clients` | `client_list`, `client_get_stats` |
| View client | `/clients/[id]` | `client_get`, `client_get_with_tasks` |
| Create client | `/clients/new` | `client_create` |
| Edit client | `/clients/[id]/edit` | `client_update` |
| Soft delete | — | `client_delete` |
| Search clients | — | `client_search` |

### 3. Task & Scheduling Flow

| Step | Route | Commands |
|------|-------|----------|
| List tasks | `/tasks`, `/schedule` | `task_list`, `calendar_get_tasks` |
| Create task | `/tasks/new` | `task_create` |
| View task | `/tasks/[id]` | `task_get`, `task_checklist_items_get` |
| Edit task | `/tasks/[id]/edit` | `edit_task` |
| Delay task | — | `delay_task` |
| Change status | — | `task_transition_status` |
| View history | — | `get_task_history` |
| Export CSV | — | `export_tasks_csv` |
| Bulk import | — | `import_tasks_bulk` |

### 4. Quote to Task Flow

| Step | Route | Commands |
|------|-------|----------|
| List quotes | `/quotes` | `quote_list` |
| Create quote | `/quotes/new` | `quote_create` |
| View quote | `/quotes/[id]` | `quote_get` |
| Add items | — | `quote_item_add`, `quote_item_update` |
| Mark sent | — | `quote_mark_sent` |
| Accept quote | — | `quote_mark_accepted` |
| Convert to task | — | `quote_convert_to_task` |
| Reject quote | — | `quote_mark_rejected` |
| Export PDF | — | `quote_export_pdf` |

### 5. Intervention Execution Flow

| Step | Route | Commands |
|------|-------|----------|
| View assigned | `/interventions`, `/tasks/[id]` | `intervention_get`, `intervention_get_active_by_task` |
| Start intervention | — | `intervention_start` |
| View workflow | `/tasks/[id]/workflow/ppf/` | `intervention_get_progress` |
| Progress steps | — | `intervention_advance_step`, `intervention_save_step_progress` |
| Record materials | — | `material_record_consumption` |
| Take photos | — | `document_store_photo`, `document_get_photos` |
| Finalize | — | `intervention_finalize` |
| View report | — | `report_get_by_intervention` |

### 6. Inventory Management Flow

| Step | Route | Commands |
|------|-------|----------|
| List materials | `/inventory` | `material_list`, `inventory_get_dashboard_data` |
| Create material | — | `material_create` |
| Update stock | — | `material_update_stock`, `material_adjust_stock` |
| View consumption | — | `material_get_consumption_history` |
| Low stock alerts | — | `material_get_low_stock_materials` |
| Categories | — | `material_list_categories`, `material_create_category` |
| Suppliers | — | `material_list_suppliers`, `material_create_supplier` |

### 7. Calendar & Dashboard Flow

| Step | Route | Commands |
|------|-------|----------|
| Calendar view | `/`, `/schedule` | `calendar_get_tasks`, `get_events` |
| Dashboard | `/dashboard` | `dashboard_get_stats`, `get_entity_counts` |
| Check conflicts | — | `calendar_check_conflicts` |
| Schedule task | — | `calendar_schedule_task` |

### 8. Administration Flow

| Step | Route | Commands |
|------|-------|----------|
| User management | `/users`, `/admin` | `get_users`, `create_user`, `update_user`, `delete_user` |
| Organization | `/settings/organization` | `get_organization`, `update_organization`, `upload_logo` |
| App settings | `/settings/system` | `get_app_settings`, `update_general_settings` |
| Security policies | `/settings/security-policies` | `update_security_policies` |
| User profile | `/settings/profile` | `get_user_settings`, `update_user_profile` |
| User preferences | `/settings/preferences` | `update_user_preferences` |
| Trash | `/trash` | `list_trash`, `restore_entity`, `hard_delete_entity`, `empty_trash` |

### 9. Settings Flow

| Step | Route | Commands |
|------|-------|----------|
| General | `/settings` | `get_app_settings`, `update_general_settings` |
| Security | `/settings/security` | `update_security_settings`, `get_active_sessions`, `revoke_session` |
| Business rules | `/settings/business` | `update_business_rules` |
| Integrations | `/settings/integrations` | `update_integrations` |
| Performance | `/settings/performance` | `update_performance_configs` |
| Monitoring | `/settings/monitoring` | System metrics |

## Design System Rules

### Typography & Colors

- **Typography**: `shadcn/ui` hierarchy
- **Colors**: Tailwind theme variables:
  - `primary` — Main actions
  - `secondary` — Secondary actions
  - `destructive` — Destructive actions
  - `muted` — Disabled/inactive
  - `accent` — Highlights

### Feedback Patterns

| State | Implementation |
|-------|----------------|
| Loading | Skeleton or Spinner component |
| Success | Toast notification |
| Error | Toast with error message from `ApiResponse.error` |
| Validation | Real-time via Zod schemas + react-hook-form |

### Component Patterns

| Pattern | Use Case |
|---------|----------|
| Modal | Focused creation/editing (e.g., "Add Client") |
| Sheet | Context-aware details (e.g., "Task Details" from calendar) |
| Form | `shadcn/ui` Form + react-hook-form + Zod |
| Table | TanStack Table for data grids |
| Dialog | Confirmations, alerts |
| Toast | `components/ui/toast` for notifications |

## Navigation Structure

### Sidebar

Main navigation via sidebar for primary domains:
- Dashboard `/`
- Schedule `/schedule`
- Clients `/clients`
- Tasks `/tasks`
- Quotes `/quotes`
- Interventions `/interventions`
- Inventory `/inventory`

### Breadcrumbs

Nested views include breadcrumbs for context.

### Deep Linking

Supported via Next.js App Router.

## Mobile Considerations

While RPMA is a desktop app, the **Intervention Execution** flow must be usable on tablet devices:
- Touch-friendly buttons (minimum 44px tap targets)
- Clear progress indicators
- Large form inputs
- Step-by-step workflow guidance

## Accessibility (A11y)

| Requirement | Implementation |
|-------------|----------------|
| Hover/focus states | Clear visual indicators |
| Keyboard navigation | Tab order, Enter/Escape support |
| Contrast | WCAG AA minimum |
| Screen readers | ARIA labels on interactive elements |

## Key Routes

| Route | Purpose | Auth Required |
|-------|---------|---------------|
| `/` | Calendar Dashboard | Yes |
| `/login` | Authentication | No |
| `/signup` | Account creation | No |
| `/onboarding` | First-time setup | No |
| `/bootstrap-admin` | Initial admin setup | No |
| `/admin` | Admin panel | Admin |
| `/unauthorized` | Access denied | — |
| `/configuration` | System configuration | Admin |
| `/staff` | Staff management | Admin |

## Error Handling

| Error Type | User Experience |
|------------|-----------------|
| Validation | Inline form errors via Zod |
| Auth failure | Redirect to `/login` |
| Authorization | Redirect to `/unauthorized` |
| Network/IPC | Toast with sanitized error message |
| Not found | Empty state component |

## State Management Patterns

| Data Type | Approach |
|-----------|----------|
| Server state | TanStack Query with query key factories |
| Global UI state | Zustand (e.g., notification panel, calendar view) |
| Form state | react-hook-form + Zod validation |
| Local component state | `useState` for toggles |

## Key UI Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `Button` | `components/ui/button` | Actions |
| `Form` | `components/ui/form` | Form handling |
| `DataTable` | Domain components | Tabular data |
| `Toast` | `components/ui/toast` | Notifications |
| `Dialog/Sheet` | `components/ui/dialog` | Modals |
| `Skeleton` | `components/ui/skeleton` | Loading states |
| `Select` | `components/ui/select` | Dropdowns |
| `Input` | `components/ui/input` | Text fields |
| `Calendar` | `components/ui/calendar` | Date selection |

## Form Validation

All forms use Zod schemas for validation:

```typescript
// Example from tasks domain
const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional(),
  client_id: z.string().uuid("Invalid client ID"),
  scheduled_date: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});
```