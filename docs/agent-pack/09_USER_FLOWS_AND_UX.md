# 09. USER FLOWS AND UX

## Main User Flows

### 1. Task Planning (Supervisor)
- **Route**: `/dashboard` or `/calendar`.
- **Flow**: Supervisor views available inventory and resources -> creates a new Task -> assigns it to a Technician -> Task appears on Technician's calendar.
- **Backend Touchpoints**: `create_task`, `reschedule_task`.

### 2. Intervention Execution (Technician)
- **Route**: `/interventions/:id`.
- **Flow**: Technician opens the scheduled task -> Starts intervention -> Logs step-by-step progress (e.g., Cleaning, Applying Film) -> Uploads quality photos -> Completes intervention.
- **Backend Touchpoints**: `start_intervention`, `advance_intervention_step`, `add_photo`, `complete_intervention`.

### 3. Inventory Management (Admin/Supervisor)
- **Route**: `/inventory`.
- **Flow**: Admin adds new material (e.g., PPF rolls) -> Updates stock levels -> Stock is deducted automatically when an intervention completes.

## UX and Design System
- **Framework**: Tailwind CSS paired with `shadcn/ui`.
- **Styling Rules**:
  - Prefer utility classes for layout and spacing.
  - Use semantic color tokens defined in `tailwind.config.ts` (e.g., `bg-primary`, `text-muted-foreground`).
  - Do not introduce custom CSS files unless absolutely necessary.
- **Interactions**:
  - Offline-first means instant UI feedback. Assume success locally (optimistic updates in React Query) while the backend processes.
  - Provide clear loading states (spinners/skeletons) during heavy IPC calls or photo processing.
  - Use `toast` notifications for success/error feedback.