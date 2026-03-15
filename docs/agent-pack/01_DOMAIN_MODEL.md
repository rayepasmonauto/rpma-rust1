# 01. DOMAIN MODEL

The RPMA v2 domain model is centered around the **Intervention**, which represents the actual work performed on a **Task** for a **Client**.

## Core Entities

### 1. Task (`tasks`)
- **Purpose**: Represents a requested job.
- **Key Fields**: `id`, `title`, `description`, `status` (Enum), `priority` (Enum), `technician_id`, `client_id`, `scheduled_at`.
- **Lifecycle**: `Draft` → `Scheduled` → `In Progress` → `Completed` | `Cancelled` | `Delayed`.
- **Relations**: Belongs to a **Client**, assigned to a **User** (Technician), contains one or more **Interventions**.

### 2. Client (`clients`)
- **Purpose**: Individuals or organizations requesting service.
- **Key Fields**: `id`, `name`, `email`, `phone`, `address`, `client_type` (Enum).
- **Lifecycle**: Active / Inactive.

### 3. Intervention (`interventions`)
- **Purpose**: The execution phase of a task.
- **Key Fields**: `id`, `task_id`, `status`, `current_step_id`, `started_at`, `completed_at`.
- **Flow**: Start → Progress Steps → Record Consumption → Finalize.
- **Relations**: Linked to a **Task**, tracks consumed **Materials**.

### 4. Material / Inventory (`inventory`)
- **Purpose**: Consumables used during interventions (e.g., PPF rolls, solutions).
- **Key Fields**: `sku`, `name`, `category_id`, `quantity_on_hand`, `unit_of_measure`, `price`.
- **Relations**: Materials are consumed by **Interventions**.

### 5. User (`users`)
- **Purpose**: System actors.
- **Roles**: `Admin`, `Supervisor`, `Technician`, `Viewer`.
- **Key Fields**: `id`, `username`, `email`, `role`, `status`.

### 6. Quote (`quotes`)
- **Purpose**: Pre-sale estimates.
- **Lifecycle**: `Draft` → `Sent` → `Accepted` → `Converted to Task`.

## Storage & Implementation Patterns
- **Table Names**: Generally match the entity name in plural (e.g., `tasks`, `clients`).
- **Soft Delete**: ADR-011 establishes a `deleted_at` timestamp for most entities instead of hard deletion.
- **Timestamps**: ADR-012 mandates the use of **Unix milliseconds** (i64) for all timestamps (`created_at`, `updated_at`).
- **IDs**: UUID v4 strings are preferred for primary keys to support future synchronization.

## Domain Rules (Partial)
- Only an `Admin` or `Supervisor` can delete a client.
- A `Technician` can only see tasks assigned to them (enforced via `resolve_context!`).
- Stock levels must be updated atomically when an intervention is finalized.
