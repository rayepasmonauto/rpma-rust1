# RPMA v2 - User Flows and UX

> Main user workflows, entry routes, UI states, and design system guide.

---

## User Flow Overview

### Primary User Roles

| Role | Primary Flows | Access Level |
|------|--------------|--------------|
| **Admin** | All flows | Full system access |
| **Supervisor** | Tasks, Scheduling, Reports, Quotes | All except system settings |
| **Technician** | My Tasks, Interventions, Inventory (consumption) | Assigned work only |
| **Viewer** | View Tasks, View Reports | Read-only all |

---

## 1. Task Management Flow

### Entry Routes

- **List View**: `/tasks` or `/dashboard`
- **Detail View**: `/tasks/[id]`
- **Create**: `/tasks/new`
- **Edit**: `/tasks/[id]/edit`

### Key UI States

```
┌─────────────────────────────────────────────────────────────────┐
│ Task List (Kanban / Table / Calendar views)                      │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                │
│ │  Draft  │ │Scheduled│ │In Prog  │ │Completed│                │
│ │  [5]    │ │  [12]   │ │  [8]    │ │  [24]   │                │
│ │ • Task1 │ │ • Task2 │ │ • Task3 │ │ • Task4 │                │
│ │ • Task5 │ │ • ...   │ │ • ...   │ │ • ...   │                │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

**States**:
- **Empty**: "No tasks found" + "Create First Task" CTA
- **Loading**: Skeleton cards
- **Populated**: Drag-drop kanban or sortable table
- **Error**: Retry button + error details

### Backend Commands

| Action | Command | Permission |
|--------|---------|------------|
| List tasks | `task_crud` (list) | Protected |
| Get task | `task_crud` (get) | Protected |
| Create task | `task_crud` (create) | Supervisor+ |
| Update task | `edit_task` | Role-based fields |
| Delete task | `task_crud` (delete) | Supervisor+ |
| Change status | `task_transition_status` | Role-based |
| Export CSV | `export_tasks_csv` | Protected |

### Validations & Errors

- **Title required**: Min 1 char, max 200
- **Client required**: Must select existing client
- **Date validation**: `scheduled_date` must be future
- **Status transition**: Enforced by state machine
- **Assignment**: Only Supervisor+ can assign

### Mobile Considerations

- Swipe actions: Complete, Edit, Delete
- Quick-add floating button
- Filter chips for status

---

## 2. Intervention Execution Flow

### Entry Routes

- **From Task**: Click "Start Intervention" on task detail
- **Active Intervention**: `/interventions/[id]`
- **Progress**: `/interventions/[id]/progress`

### Workflow States

```
┌────────────────────────────────────────────────────────────────┐
│ Intervention Workflow                                           │
│                                                                 │
│  Step 1: Preparation      Step 2: Installation     Step 3: QC  │
│  ┌─────────────────┐      ┌─────────────────┐     ┌──────────┐ │
│  │ ◉ Complete      │ ───> │ ○ In Progress   │ ──> │ ○ Pending │ │
│  │   [Photos: 3]   │      │   [Timer: 45m]  │     │          │ │
│  └─────────────────┘      └─────────────────┘     └──────────┘ │
│                                                                 │
│  Actions: [Complete Step] [Add Photo] [Record Material]        │
└────────────────────────────────────────────────────────────────┘
```

**Progress Tracking**:
- Overall percentage
- Time elapsed vs. estimated
- Steps completed / total

### Backend Commands

| Action | Command | Permission |
|--------|---------|------------|
| Start intervention | `intervention_start` | Technician+ |
| Get active | `intervention_get_active_by_task` | Protected |
| Advance step | `intervention_advance_step` | Assigned Tech |
| Save progress | `intervention_save_step_progress` | Assigned Tech |
| Complete | `intervention_finalize` | Assigned Tech |
| Get progress | `intervention_get_progress` | Protected |

### Validations & Errors

- **One active per task**: Cannot start if existing active
- **Sequential steps**: Must complete in order (configurable)
- **Photo required**: Some steps require photo evidence
- **Material consumption**: Optional per step
- **Timer**: Auto-tracks time per step

### Key UI Components

- **WorkflowStepper**: Visual progress indicator
- **StepCard**: Current step with actions
- **PhotoGallery**: Step/intervention photos
- **MaterialConsumption**: Quick material usage form
- **TimerDisplay**: Elapsed/remaining time

---

## 3. Calendar Scheduling Flow

### Entry Routes

- **Main Calendar**: `/calendar`
- **Technician View**: `/calendar/technician/[id]`
- **Task Scheduling**: `/tasks/[id]/schedule`

### View Modes

```
┌────────────────────────────────────────────────────────────────┐
│ Calendar Views                                                  │
│                                                                 │
│  [Day] [Week] [Month] [Agenda]                                  │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  Monday 8:00  │ Task A (John)   ████████████          │   │
│  │          10:00│ Task B (Jane)       ████████          │   │
│  │          14:00│ [Available slot]    [+ Schedule]       │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

**States**:
- **Empty day**: "No events" + quick-add
- **Conflict**: Overlapping events highlighted in red
- **Scheduled**: Task appears on calendar
- **Available**: Click to schedule

### Backend Commands

| Action | Command | Permission |
|--------|---------|------------|
| Get events | `get_events` | Protected |
| Create event | `create_event` | Supervisor+ |
| Update event | `update_event` | Supervisor+ |
| Delete event | `delete_event` | Supervisor+ |
| Check conflicts | `calendar_check_conflicts` | Protected |
| Schedule task | `calendar_schedule_task` | Supervisor+ |

### Validations & Errors

- **Conflict detection**: Overlapping technician schedules
- **Business hours**: Configurable work hours
- **Task status**: Only scheduled/in-progress tasks
- **Technician availability**: Check existing assignments

### Drag-and-Drop

- Drag task from list to calendar slot
- Drag event to reschedule
- Visual conflict indicators

---

## 4. Client Management Flow

### Entry Routes

- **Client List**: `/clients`
- **Client Detail**: `/clients/[id]`
- **Create**: `/clients/new`
- **Edit**: `/clients/[id]/edit`

### Client Detail View

```
┌────────────────────────────────────────────────────────────────┐
│ Client: John Doe                                                │
│ ┌──────────────┐ ┌─────────────────────────────────────────┐   │
│ │  [Avatar]    │ │ Contact: john@example.com               │   │
│ │              │ │ Phone: +1 555-0123                      │   │
│ │  [Edit]      │ │ Address: 123 Main St                    │   │
│ └──────────────┘ │          Springfield                    │   │
│                  │          IL 62704                       │   │
│  Stats:          └─────────────────────────────────────────┘   │
│  • 12 Tasks      ┌─────────────┐ ┌─────────────────────┐     │
│  • 8 Completed   │ Active Task │ │ Quote History       │     │
│  • 4 Pending     │ • Task #123 │ │ • Q-2024-001        │     │
│                  │ • In Progress│ │ • Q-2024-089        │     │
│                  └─────────────┘ └─────────────────────┘     │
└────────────────────────────────────────────────────────────────┘
```

### Backend Commands

| Action | Command | Permission |
|--------|---------|------------|
| List clients | `client_crud` (list) | Protected |
| Get client | `client_crud` (get) | Protected |
| Create client | `client_crud` (create) | Supervisor+ |
| Update client | `client_crud` (update) | Supervisor+ |
| Delete client | `client_crud` (delete) | Supervisor+ (soft) |
| Get stats | `get_client_statistics` | Protected |

### Validations & Errors

- **Email unique**: Cannot duplicate existing
- **Phone format**: Validated on input
- **Name required**: First + last name
- **Soft delete**: Preserves history

---

## 5. Quote Management Flow

### Entry Routes

- **Quote List**: `/quotes`
- **Quote Builder**: `/quotes/new` or `/quotes/[id]/edit`
- **PDF Preview**: `/quotes/[id]/preview`

### Quote Builder UI

```
┌────────────────────────────────────────────────────────────────┐
│ Quote Builder                                          [Save]  │
│                                                                 │
│  Client: [John Doe ▼]              Quote #: Q-2024-123        │
│  Valid Until: [2024-12-31]                                      │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ #  Type       Description          Qty  Price   Total │   │
│  │ ─────────────────────────────────────────────────────  │   │
│  │ 1  Service   PPF Installation      1    $500    $500  │   │
│  │ 2  Material  Premium Film Roll     1.5  $200    $300  │   │
│  │ 3  Labor     Prep & Finish         2    $75     $150  │   │
│  │                                                        │   │
│  │ [+ Add Item]                                           │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Subtotal: $950                                                │
│  Tax (10%): $95                                                │
│  Total: $1,045                                                │
│                                                                 │
│  [Export PDF] [Send Email] [Convert to Task]                   │
└────────────────────────────────────────────────────────────────┘
```

### Status Flow

```
Draft ──> Sent ──> (Accepted / Rejected / Expired)
              │
              └──> Converted to Task
```

### Backend Commands

| Action | Command | Permission |
|--------|---------|------------|
| Create quote | `quote_create` | Supervisor+ |
| Update quote | `quote_update` | Supervisor+ |
| Add item | `quote_item_add` | Supervisor+ |
| Export PDF | `quote_export_pdf` | Supervisor+ |
| Mark sent | `quote_mark_sent` | Supervisor+ |
| Convert to task | `quote_convert_to_task` | Supervisor+ |

### Validations & Errors

- **Client required**: Must select existing
- **At least one item**: Cannot save empty
- **Valid until**: Must be future date
- **Item types**: labor | material | service | discount
- **Discount**: Negative amount, affects total

---

## 6. Inventory Management Flow

### Entry Routes

- **Dashboard**: `/inventory`
- **Material List**: `/inventory/materials`
- **Material Detail**: `/inventory/materials/[id]`
- **Transactions**: `/inventory/transactions`

### Dashboard View

```
┌────────────────────────────────────────────────────────────────┐
│ Inventory Dashboard                                             │
│                                                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
│  │ Total Items │ │ Low Stock   │ │ Value       │              │
│  │    156      │ │    12       │ │ $45,230     │              │
│  └─────────────┘ └─────────────┘ └─────────────┘              │
│                                                                 │
│  Alerts:                                                        │
│  ⚠️  PPF Film X is below minimum stock (5 < 10)                │
│  ⚠️  Adhesive Y expires in 7 days                              │
│                                                                 │
│  Recent Transactions:                                          │
│  • Stock In: PPF Film (+20 units) - 2 hours ago               │
│  • Consumption: Task #123 (-2 units) - 5 hours ago            │
└────────────────────────────────────────────────────────────────┘
```

### Backend Commands

| Action | Command | Permission |
|--------|---------|------------|
| List materials | `material_list` | Protected |
| Get dashboard | `inventory_get_dashboard_data` | Protected |
| Update stock | `material_update_stock` | Supervisor+ |
| Record consumption | `material_record_consumption` | Technician+ |
| Get transactions | `material_get_transaction_history` | Protected |

### Validations & Errors

- **Stock non-negative**: DB constraint
- **Reason required**: For adjustments
- **Consumption**: Must have sufficient stock
- **Expiry tracking**: Date validation

---

## 7. Authentication Flow

### Entry Routes

- **Login**: `/auth/login`
- **First Setup**: `/bootstrap` (if no admins)

### Login UI

```
┌────────────────────────────────────────────────────────────────┐
│                        RPMA v2                                  │
│                                                                 │
│                     [Logo/Icon]                                 │
│                                                                 │
│  Username: [____________________]                              │
│                                                                 │
│  Password: [____________________]                              │
│            [Forgot Password?]                                   │
│                                                                 │
│            [       Sign In       ]                             │
│                                                                 │
│  Session expires after 8 hours                                 │
└────────────────────────────────────────────────────────────────┘
```

### States

- **Initial**: Empty form
- **Loading**: "Signing in..."
- **Error**: "Invalid credentials" (no details)
- **Success**: Redirect to dashboard
- **First Boot**: Setup first admin account

### Backend Commands

| Action | Command | Permission |
|--------|---------|------------|
| Login | `auth_login` | Public |
| Logout | `auth_logout` | Protected |
| Check session | `auth_validate_session` | Protected |
| Create first admin | `bootstrap_first_admin` | Public (first only) |

### Security

- **Rate limiting**: 5 attempts per 15 minutes
- **Password hashing**: Argon2id
- **Session TTL**: 8 hours
- **Secure storage**: AES-GCM encryption

---

## 8. Admin & Settings Flows

### Entry Routes

- **Settings**: `/settings`
- **User Management**: `/admin/users`
- **Organization**: `/organization`
- **System Config**: `/admin/system` (Admin only)

### Settings Categories

```
┌────────────────────────────────────────────────────────────────┐
│ Settings                                                        │
│ ┌──────────────┬───────────────────────────────────────────────┐│
│ │ Profile      │  Name: [John Doe                    ]        ││
│ │ Preferences  │  Email: [john@example.com           ]        ││
│ │ Security     │                                                ││
│ │ Notifications│  [Change Password]                             ││
│ │              │  [Upload Avatar]                               ││
│ └──────────────┴───────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────┘
```

### Backend Commands

| Action | Command | Permission |
|--------|---------|------------|
| Get settings | `get_app_settings` | Protected |
| Update profile | `update_user_profile` | Self |
| Change password | `change_user_password` | Self |
| Manage users | `user_crud` | Admin |
| System config | `update_*_settings` | Admin |

---

## 9. Reporting Flow

### Entry Routes

- **Reports Dashboard**: `/reports`
- **Specific Report**: `/reports/[type]`

### Report Types

| Report | Data | Permission |
|--------|------|------------|
| Task Summary | Tasks by status, completion rate | Protected |
| Technician Performance | Tasks completed, time taken | Supervisor+ |
| Inventory Usage | Material consumption trends | Protected |
| Financial | Revenue by period, quote conversion | Supervisor+ |
| Client Activity | Top clients, repeat business | Supervisor+ |

### Backend Commands

| Action | Command | Permission |
|--------|---------|------------|
| Get capabilities | `reports_get_capabilities` | Protected |
| Generate report | `report_generate` | Role-based |
| Get report | `report_get` | Protected |
| List reports | `report_list` | Protected |

---

## Design System Guardrails

### Tailwind + shadcn/ui

**Color Palette** (from `frontend/tailwind.config.ts`):
```
Primary:    #3B82F6 (blue-500)
Secondary:  #64748B (slate-500)
Success:    #10B981 (emerald-500)
Warning:    #F59E0B (amber-500)
Danger:     #EF4444 (red-500)
```

**Spacing Scale**:
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px

### Component Patterns

**Form Layout**:
```tsx
<Form {...form}>
  <form className="space-y-4">
    <FormField name="title" render={({ field }) => (
      <FormItem>
        <FormLabel>Title</FormLabel>
        <FormControl>
          <Input {...field} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )} />
    <Button type="submit">Save</Button>
  </form>
</Form>
```

**Data Table**:
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Title</TableHead>
      <TableHead>Status</TableHead>
      <TableHead className="text-right">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {tasks.map(task => (
      <TableRow key={task.id}>
        <TableCell>{task.title}</TableCell>
        <TableCell><TaskStatusBadge status={task.status} /></TableCell>
        <TableCell className="text-right">
          <TaskActions task={task} />
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### Responsive Breakpoints

| Breakpoint | Width | Usage |
|------------|-------|-------|
| sm | 640px | Mobile landscape |
| md | 768px | Tablet |
| lg | 1024px | Desktop |
| xl | 1280px | Large desktop |

### Accessibility Requirements

- All forms have labels
- Color contrast >= 4.5:1
- Focus indicators visible
- Keyboard navigation support
- Screen reader labels

---

## Mobile Adaptations

### Touch Targets

- Minimum 44x44px touch target
- Swipe gestures for common actions
- Bottom sheet for forms
- Floating action button for primary action

### Mobile-First States

- List cards stack vertically
- Detail views are scrollable
- Forms use bottom sheets
- Navigation uses bottom tabs or hamburger

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `frontend/src/app/layout.tsx` | Root layout |
| `frontend/src/app/globals.css` | Global styles, Tailwind |
| `frontend/tailwind.config.ts` | Tailwind configuration |
| `frontend/src/components/ui/` | shadcn/ui components |
| `frontend/src/lib/utils.ts` | Utility functions (cn) |

---

## Next Steps

- **Project Overview**: See [00_PROJECT_OVERVIEW.md](./00_PROJECT_OVERVIEW.md)
- **Domain Model**: See [01_DOMAIN_MODEL.md](./01_DOMAIN_MODEL.md)

---

*Design System: Uses shadcn/ui + Tailwind CSS*
