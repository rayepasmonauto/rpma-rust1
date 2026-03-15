# 09. USER FLOWS AND UX

This guide summarizes the primary journeys users take through the RPMA v2 application.

## 1. Authentication & Dashboard
- **Flow**: Login → Home/Dashboard.
- **Goal**: Provide an overview of active tasks, recent activities, and system health.
- **Key Commands**: `auth_login`, `dashboard_get_stats`, `get_recent_activities`.

## 2. Task Management
- **Flow**: Task List → Filter by Status/Technician → Create/Edit Task → Schedule on Calendar.
- **Goal**: Manage the backlog of work and assign jobs to the right people.
- **Key Commands**: `task_crud`, `calendar_schedule_task`.
- **UX**: Use of status badges (colors matching shadcn tokens) and drag-and-drop calendar scheduling.

## 3. Intervention Execution (The "Technician Path")
- **Flow**: Task Details → Start Intervention → Progress through Steps → Record Materials → Finalize.
- **Goal**: Accurately capture technical work and material usage in the field.
- **Key Commands**: `intervention_start`, `intervention_advance_step`, `material_record_consumption`, `intervention_finalize`.
- **UX**: Mobile-friendly progress bars, photo upload prompts at specific steps, and clear validation on material quantities.

## 4. Inventory & Materials
- **Flow**: Inventory List → View Stock Levels → Record Adjustment → View Consumption History.
- **Goal**: Prevent stockouts and track material costs.
- **Key Commands**: `material_list`, `material_adjust_stock`, `material_get_stats`.

## 5. Reporting & Closing
- **Flow**: Finalized Intervention → Generate Report → View/Export PDF → Notify Client.
- **Goal**: Deliver professional evidence of work to the client and close the financial loop.
- **Key Commands**: `report_generate`, `quote_convert_to_task` (for the pre-sale flow).

## Design System Guardrails
- **Tailwind Tokens**: Use defined colors (`primary`, `secondary`, `destructive`, `muted`) rather than arbitrary hex codes.
- **Typography**: Follow the `shadcn/ui` hierarchy (H1, H2, H3, Large, Small, Muted).
- **Feedback**: Every action should provide visual feedback (Toasts for success/error, loading spinners for background IPC calls).
- **Responsive**: While a desktop app, the intervention execution flow should remain usable on tablet-sized windows.

## Common UX Patterns
- **Empty States**: Show informative messages when a list (e.g., "No tasks scheduled today") is empty.
- **Skeletons**: Use skeleton loaders (`Skeleton` component) while waiting for IPC responses to reduce perceived latency.
- **Modals vs. Sheets**: Use Modals for focused tasks (creating a client) and Sheets for context-aware side panels (task details).
