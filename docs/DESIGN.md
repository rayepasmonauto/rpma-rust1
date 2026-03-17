# Design Documentation

## Overview

**Framework**: Next.js 14 with App Router
**Component Library**: shadcn/ui
**Styling**: Tailwind CSS
**State Management**: React Query (server state) + Zustand (client state)
**Type Safety**: TypeScript with auto-generated types from Rust via ts-rs

---

## Architecture Overview

```
frontend/src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Home (Calendar Dashboard)
│   ├── layout.tsx          # Root layout (server)
│   ├── RootClientLayout.tsx# Client layout with auth/providers
│   ├── providers.tsx       # QueryClient, AuthProvider, Toaster
│   ├── globals.css          # Design tokens
│   ├── login/              # Authentication pages
│   ├── signup/
│   ├── dashboard/          # Main dashboard
│   ├── tasks/              # Task management
│   ├── clients/            # Client management
│   ├── quotes/             # Quote management
│   ├── inventory/          # Inventory management
│   ├── staff/              # Staff management
│   ├── admin/              # Admin panel
│   ├── settings/           # Settings
│   ├── trash/              # Trash/recycle bin
│   └── api/                # API routes (40+ endpoints)
├── components/
│   ├── layout/             # Layout components
│   │   ├── AppShell.tsx    # Main app shell with sidebar
│   │   ├── Topbar.tsx      # 62px fixed header
│   │   ├── DrawerSidebar.tsx# 280px collapsible sidebar
│   │   └── RPMALayout.tsx  # Page layout wrapper
│   ├── ui/                 # shadcn/ui base components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── form.tsx
│   │   ├── table.tsx
│   │   ├── badge.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   └── ...
│   └── shared/             # Shared UI patterns
│       ├── EmptyState.tsx
│       ├── LoadingState.tsx
│       └── ErrorBoundary.tsx
├── domains/
│   ├── [domain]/
│   │   ├── api/            # React Query hooks
│   │   │   └── queries.ts  # useQuery, useMutation hooks
│   │   ├── components/     # Domain-specific UI
│   │   ├── hooks/          # Custom hooks
│   │   ├── ipc/            # Tauri IPC wrappers
│   │   │   └── [domain]Ipc.ts
│   │   ├── services/       # Frontend business logic
│   │   └── stores/         # Zustand stores
├── hooks/                  # Global custom hooks
│   ├── useAuth.ts
│   ├── useTheme.ts
│   └── useDebounce.ts
├── lib/                    # Utilities
│   ├── ipc.ts              # IPC client
│   ├── queryKeys.ts        # React Query keys
│   └── utils.ts            # Helper functions
├── types/                  # AUTO-GENERATED — DO NOT EDIT
│   └── [domain].ts         # Generated from Rust
└── shared/                 # Shared contracts
    └── types.ts
```

---

## Major Components

### Layout Components

| Component | File | Purpose |
|-----------|------|---------|
| AppShell | `components/layout/AppShell.tsx` | Main app shell with sidebar (toggle state persisted in localStorage), topbar, and mobile drawer |
| Topbar | `components/layout/Topbar.tsx` | Fixed 62px header with navigation tabs, search, and notification bell |
| DrawerSidebar | `components/layout/DrawerSidebar.tsx` | 280px collapsible sidebar with organization section, user dropdown, and navigation items |
| RPMALayout | `components/layout/RPMALayout.tsx` | Thin wrapper around AppShell for page layouts |

### Core UI Components (shadcn/ui)

| Component | File | Variants | Usage |
|-----------|------|----------|-------|
| Button | `button.tsx` | default, destructive, outline, secondary, ghost, link | Primary actions |
| Badge | `badge.tsx` | success, warning, error, info, workflow-* | Status display |
| Card | `card.tsx` | default, RPMA-bordered | Content containers |
| Dialog | `dialog.tsx` | default, confirmation | Modals |
| Form | `form.tsx` | React Hook Form integration | Form handling |
| Table | `DesktopTable.tsx` | sorting, filtering, keyboard nav | Data display |
| EmptyState | `empty-state.tsx` | Icon, title, description, actions | Empty data |
| StatusBadge | `status-badge.tsx` | pending, in_progress, completed, cancelled | Standardized status |
| DesktopForm | `DesktopForm.tsx` | Schema-based, Ctrl+Enter submit | Form wrapper |

### Domain Components

| Domain | Key Components | Location |
|--------|----------------|----------|
| tasks | `WorkflowProgressCard`, `TaskTimeline`, `TasksPageContent`, `TaskCard` | `domains/tasks/components/` |
| calendar | `CalendarDashboard`, `DayView`, `WeekView`, `MonthView`, `AgendaView`, `TaskCard` | `domains/calendar/components/` |
| clients | `ClientCard`, `ClientDetail`, `ClientForm`, `ClientSelector`, `ClientList` | `domains/clients/components/` |
| quotes | `QuoteTotals`, `QuoteItemsTable`, `QuoteDocumentsManager`, `QuoteStatusBadge`, `QuoteWorkflowPanel` | `domains/quotes/components/` |
| inventory | `InventoryManager`, `MaterialCatalog`, `MaterialForm`, `StockLevelIndicator` | `domains/inventory/components/` |
| admin | `AdminOverviewTab`, `SystemSettingsTab`, `SecurityPoliciesTab`, `IntegrationsTab` | `domains/admin/components/` |
| auth | `LoginForm`, `SignupForm`, `PasswordStrengthMeter` | `domains/auth/components/` |
| reports | `ReportPreviewPanel`, `InterventionReportSection` | `domains/reports/components/` |

---

## Design Tokens

### Color Palette

Defined in `frontend/src/app/globals.css` as CSS custom properties:

```css
:root {
  /* Background & Surface */
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;

  /* Primary Brand */
  --primary: 174 72% 78%;          /* #1ad1ba - Teal */
  --primary-foreground: 210 40% 98%;
  --rpma-primary: 147 71% 52%;     /* #3cd4a0 - RPMA Green */
  --rpma-surface: 0 0% 100%;
  --rpma-border: 214.3 31.8% 91.4%;

  /* Secondary */
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;

  /* Muted */
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;

  /* Accent */
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;

  /* Destructive */
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;

  /* Semantic Colors */
  --success: 142 76% 45%;          /* #22c55e */
  --warning: 38 92% 50%;           /* #F59E0B */
  --error: 0 72% 51%;               /* #EF4444 */
  --info: 221 83% 53%;              /* #3B82F6 */

  /* Chart Colors */
  --chart-1: 174 72% 78%;          /* Teal */
  --chart-2: 221 83% 53%;           /* Blue */
  --chart-3: 38 92% 50%;            /* Amber */
  --chart-4: 142 76% 45%;           /* Green */
  --chart-5: 25 95% 53%;            /* Orange */

  /* Border & Input */
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 174 72% 78%;

  /* Radius */
  --radius: 0.5rem;
}

/* Priority Colors (direct values, not CSS variables) */
--priority-low: #3B82F6;       /* Blue */
--priority-medium: #F59E0B;    /* Amber */
--priority-high: #F97316;      /* Deep Orange */
--priority-urgent: #EF4444;    /* Red */

/* Workflow Status Colors */
--workflow-draft: #6B7280;      /* Gray */
--workflow-scheduled: #3B82F6;  /* Blue */
--workflow-inProgress: #F59E0B; /* Amber */
--workflow-completed: #10B981;  /* Green */
--workflow-cancelled: #EF4444;  /* Red */
```

### Typography Scale

| Token | Size | Font Family | Usage |
|-------|------|-------------|-------|
| 2xs | 10px | Geist Sans | Tiny labels, captions |
| xs | 12px | Geist Sans | Small text, captions |
| sm | 14px | Geist Sans | Body small, labels |
| base | 16px | Geist Sans | Body text |
| lg | 18px | Geist Sans | Body large |
| xl | 20px | Geist Sans | H4 headings |
| 2xl | 24px | Geist Sans | H3 headings |
| 3xl | 30px | Geist Sans | H2 headings |
| 4xl | 36px | Geist Sans | H1 headings |
| 5xl | 48px | Geist Sans | Display headings |
| mono | - | Geist Mono | Code, monospace |

```css
/* Font family definition */
--font-sans: Geist Sans, system-ui, sans-serif;
--font-mono: Geist Mono, ui-monospace, monospace;
```

### Spacing System (4px base unit)

| Token | Size | CSS Variable |
|-------|------|--------------|
| space-1 | 4px | `--spacing-1` |
| space-2 | 8px | `--spacing-2` |
| space-3 | 12px | `--spacing-3` |
| space-4 | 16px | `--spacing-4` |
| space-5 | 20px | `--spacing-5` |
| space-6 | 24px | `--spacing-6` |
| space-8 | 32px | `--spacing-8` |
| space-10 | 40px | `--spacing-10` |
| space-12 | 48px | `--spacing-12` |
| space-16 | 64px | `--spacing-16` |

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Tags, badges, small elements |
| default | 8px | Buttons, inputs, default cards |
| md | 8px | Alias for default |
| lg | 10px | Larger cards |
| xl | 12px | Large cards, modals |
| 2xl | 16px | Modal dialogs, large containers |
| full | 9999px | Pills, avatars, circular elements |

### Shadow System (5 Elevation Levels)

```css
/* Level 1 - Subtle */
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08);

/* Level 2 - Card */
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06);

/* Level 3 - Raised */
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);

/* Level 4 - Floating */
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04);

/* Level 5 - Modal */
--shadow-2xl: 0 25px 50px rgba(0, 0, 0, 0.25);
```

### Animation System

| Keyframe | Duration | Easing | Usage |
|----------|----------|--------|-------|
| fadeIn | 300ms | ease-out | General appear |
| fadeOut | 200ms | ease-in | General disappear |
| slideUp | 300ms | ease-out | Cards, modals |
| slideDown | 300ms | ease-out | Dropdowns |
| slideInRight | 300ms | ease-out | Sidebars, drawers |
| slideInLeft | 300ms | ease-out | Panels |
| pulse | 1500ms | ease-in-out | Loading states |
| spin | 800ms | linear | Spinner rotation |
| bounce | 1000ms | ease-in-out | Attention |

```typescript
// Animation utilities (lib/utils.ts)
const animations = {
  fadeIn: "animate-fadeIn",
  slideUp: "animate-slideUp",
  slideInRight: "animate-slideInRight",
  pulse: "animate-pulse",
  spin: "animate-spin",
};
```

---

## Route Structure

```
/                           # Home (Calendar Dashboard)
/login                      # Login page
/signup                     # Signup page
/dashboard                  # Dashboard

/tasks                      # Tasks list
/tasks/new                  # New task
/tasks/[id]                 # Task detail
/tasks/[id]/completed       # Completed view
/tasks/[id]/workflow/ppf    # PPF workflow steps

/clients                    # Clients list
/clients/new                # New client
/clients/[id]               # Client detail
/clients/[id]/edit          # Edit client

/quotes                     # Quotes list
/quotes/new                 # New quote
/quotes/[id]                # Quote detail

/inventory                  # Inventory management
/staff                      # Staff management
/admin                      # Admin panel
/trash                      # Trash/recycle bin

/settings                   # Settings
/settings/profile           # Profile settings
/settings/preferences       # Preferences
/settings/organization      # Organization
```

---

## Component Patterns

### 1. shadcn/ui Component Architecture

Components use `class-variance-authority` for variant management:

```tsx
// Example: Button with variants
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        xl: "h-12 rounded-md px-10 text-base",
        icon: "h-10 w-10",
        touch: "min-h-[44px] px-4 py-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

### 2. Form Pattern (React Hook Form + Zod)

```tsx
// DesktopForm.tsx - Schema-based forms
import { DesktopForm } from '@/components/ui/DesktopForm';
import { z } from 'zod';

const taskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  client_id: z.string().uuid("Invalid client ID"),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  scheduled_date: z.string().optional(),
  description: z.string().optional(),
});

function CreateTaskForm() {
  const handleSubmit = async (data: z.infer<typeof taskSchema>) => {
    await createTask(data);
  };

  return (
    <DesktopForm
      schema={taskSchema}
      onSubmit={handleSubmit}
      submitLabel="Create Task"
    >
      {(form) => (
        <>
          <FormField name="title" control={form.control}>
            {/* Field rendering */}
          </FormField>
          <FormField name="priority" control={form.control}>
            {/* Field rendering */}
          </FormField>
        </>
      )}
    </DesktopForm>
  );
}
```

### 3. Status Badge Pattern

```tsx
// StatusBadge.tsx - Standardized status display
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-gray-100 text-gray-800', icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-amber-100 text-amber-800', icon: AlertCircle },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
};

interface StatusBadgeProps {
  status: keyof typeof STATUS_CONFIG;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function StatusBadge({ status, size = 'md', showIcon = false }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  
  return (
    <Badge className={cn(config.color, sizeClasses[size])}>
      {showIcon && <Icon className="w-3 h-3 mr-1" />}
      {config.label}
    </Badge>
  );
}
```

### 4. Empty State Pattern

```tsx
// EmptyState.tsx - Consistent empty data placeholder
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

<EmptyState
  icon={<Inbox className="h-12 w-12 text-muted-foreground" />}
  title="No tasks found"
  description="Get started by creating your first task"
  action={{ 
    label: "Create Task", 
    onClick: () => setIsCreateOpen(true) 
  }}
  tips={[
    { 
      title: "Pro tip", 
      description: "You can create tasks from the calendar view by clicking on a date" 
    }
  ]}
/>
```

### 5. Data Table Pattern

```tsx
// DesktopTable.tsx - Feature-rich data table
import { DesktopTable } from '@/components/ui/DesktopTable';

<DesktopTable
  data={tasks}
  columns={columns}
  enableSorting={true}
  enableFiltering={true}
  enableKeyboardNavigation={true}
  pagination={{
    pageSize: 10,
    pageSizeOptions: [10, 25, 50, 100],
  }}
  emptyState={
    <EmptyState title="No tasks" description="Create your first task" />
  }
/>
```

### 6. Domain Component Structure

Each domain follows a consistent structure:

```
domains/[domain]/
├── api/
│   └── queries.ts          # React Query hooks
│       # - useQuery for fetching
│       # - useMutation for creating/updating/deleting
│       # - Query keys factory
├── components/
│   ├── [Domain]Card.tsx    # List item card
│   ├── [Domain]Detail.tsx  # Detail view
│   ├── [Domain]Form.tsx    # Create/edit form
│   ├── [Domain]List.tsx    # List view
│   └── index.ts            # Barrel export
├── hooks/
│   └── use[Domain].ts      # Domain-specific hooks
├── ipc/
│   └── [domain]Ipc.ts      # Tauri IPC wrappers
├── services/
│   └── [domain]Service.ts  # Frontend business logic
└── stores/
    └── [domain]Store.ts    # Zustand stores (optional)
```

### 7. Theme Configuration

```tsx
// providers.tsx
import { ThemeProvider } from 'next-themes';

<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  disableTransitionOnChange
>
  {children}
</ThemeProvider>

// Usage in components
const { theme, setTheme } = useTheme();
```

### 8. Error Boundary Pattern

```tsx
// GlobalErrorBoundary.tsx
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <h2 className="text-lg font-semibold mt-4">Something went wrong</h2>
      <p className="text-muted-foreground mt-2">{error.message}</p>
      <Button onClick={resetErrorBoundary} className="mt-4">
        Try again
      </Button>
    </div>
  );
}

<ErrorBoundary FallbackComponent={ErrorFallback}>
  <AppLayout>{children}</AppLayout>
</ErrorBoundary>
```

---

## Accessibility Features

### Skip Link

```tsx
// SkipLink.tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
>
  Skip to main content
</a>
```

### Focus Management

```css
/* Focus visible ring */
:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}

/* Focus ring for interactive elements */
.focus-ring:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
```

### High Contrast Support

```css
@media (prefers-contrast: high) {
  :root {
    --border: 0 0% 0%;
    --ring: 174 100% 50%;
  }
}
```

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Touch Targets

```css
/* Minimum touch target size */
.touch-target {
  min-height: 44px;
  min-width: 44px;
}

/* Touch variant for buttons */
@media (pointer: coarse) {
  .btn {
    min-height: 44px;
  }
}
```

---

## Responsive Breakpoints

```css
/* Tailwind default breakpoints */
sm: 640px   /* Small devices */
md: 768px   /* Medium devices (tablets) */
lg: 1024px  /* Large devices (laptops) */
xl: 1280px  /* Extra large devices */
2xl: 1536px /* 2XL devices */
```

### Mobile-First Approach

```tsx
// Responsive component example
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => (
    <ItemCard key={item.id} item={item} />
  ))}
</div>

// Sidebar collapse on mobile
<aside className={cn(
  "fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-200",
  "lg:translate-x-0",
  isOpen ? "translate-x-0" : "-translate-x-full"
)}>
```

---

## Loading States

### Skeleton Pattern

```tsx
// Skeleton.tsx
import { Skeleton } from '@/components/ui/skeleton';

// List skeleton
<div className="space-y-4">
  {[...Array(5)].map((_, i) => (
    <div key={i} className="flex items-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  ))}
</div>

// Card skeleton
<div className="rounded-lg border p-4">
  <Skeleton className="h-6 w-2/3 mb-4" />
  <Skeleton className="h-4 w-full mb-2" />
  <Skeleton className="h-4 w-3/4" />
</div>
```

### LoadingState Component

```tsx
// LoadingState.tsx
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">{message}</p>
    </div>
  );
}
```

---

## Icon System

Using **Lucide React** icons throughout the application:

```tsx
import {
  Plus, Edit, Trash2, Search, Filter, MoreVertical,
  Calendar, Clock, User, Building2, Phone, Mail,
  CheckCircle, XCircle, AlertTriangle, Info,
  ChevronLeft, ChevronRight, ChevronDown,
  Loader2, RefreshCw, Download, Upload,
} from 'lucide-react';

// Icon sizing
<Icon className="h-4 w-4" />  // sm
<Icon className="h-5 w-5" />  // md
<Icon className="h-6 w-6" />  // lg
<Icon className="h-8 w-8" />  // xl

// Animated loading icon
<Loader2 className="h-4 w-4 animate-spin" />
```

---

## Form Validation (Zod Schemas)

```tsx
// Common validation patterns
import { z } from 'zod';

// Email
const emailSchema = z.string().email("Invalid email address");

// Phone (French format)
const phoneSchema = z.string()
  .regex(/^(\+33|0)[1-9](\d{2}){4}$/, "Invalid phone number");

// Required string
const requiredString = z.string().min(1, "This field is required");

// Optional string
const optionalString = z.string().optional();

// UUID
const uuidSchema = z.string().uuid("Invalid ID");

// Date string
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format");

// Positive number
const positiveNumber = z.number().positive("Value must be positive");

// Enum
const statusSchema = z.enum(['draft', 'scheduled', 'in_progress', 'completed', 'cancelled']);

// Object schema
const taskSchema = z.object({
  title: requiredString.max(200, "Title must be less than 200 characters"),
  description: optionalString,
  client_id: uuidSchema,
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  scheduled_date: dateSchema.optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;
```

---

## Gaps & Recommendations

1. **Missing Style Guide**: Consider creating a dedicated `STYLE_GUIDE.md` with visual examples
2. **Storybook Setup**: Add Storybook for component documentation and visual testing
3. **Color Contrast Audit**: Run automated accessibility checks on color combinations
4. **Icon Organization**: Consider creating semantic icon components (e.g., `AddIcon`, `DeleteIcon`)
5. **Animation Library**: Consider Framer Motion for complex animations
6. **Form Library**: Consider React Hook Form's `FormProvider` for deeply nested forms
7. **Internationalization**: Prepare for i18n with proper string extraction
8. **Performance**: Consider virtualization for long lists (>100 items)