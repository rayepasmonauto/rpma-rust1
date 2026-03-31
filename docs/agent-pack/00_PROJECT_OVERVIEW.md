# PROJECT OVERVIEW: RPMA v2

RPMA v2 (Resource Planning & Management Application) is a specialized, offline-first desktop application designed for the planning, execution, and auditing of Paint Protection Film (PPF) field interventions.

## Primary Users
- **Field Technicians**: Execute interventions, log steps, and capture photos in the field.
- **Supervisors**: Coordinate planning, schedule tasks via the calendar, and ensure quality control.
- **Administrators**: Manage users, security policies, system configuration, and organizational settings.

## Core Goals
- **Offline-First**: Reliable operation in environments with poor or no connectivity. Data is persisted locally and synchronized when online.
- **Surgical Accuracy**: Precise tracking of intervention steps and material usage.
- **Auditability**: Complete history of tasks, interventions, and system changes.

## Tech Stack
| Layer | Technology | Role |
|---|---|---|
| **Desktop Shell** | Tauri 2.1 | Native runtime and IPC transport |
| **Backend** | Rust (Edition 2021) | Domain logic, persistence, and system integration |
| **Frontend** | Next.js 14 (App Router) | UI framework and state management |
| **Database** | SQLite (WAL Mode) | Local persistence with high concurrency support |
| **Server State** | TanStack Query v5 | Backend state caching and synchronization |
| **Local State** | Zustand | Client-only UI state management |
| **Styling** | Tailwind CSS + shadcn/ui | Utility-first styling and accessible components |
| **Contract Gen** | ts-rs | Automated Rust-to-TypeScript type synchronization |

## High-Level Modules
- **Tasks**: Lifecycle management of field work orders.
- **Interventions**: The core workflow engine for executing PPF installations.
- **Clients**: CRM for managing customer profiles and statistics.
- **Calendar**: Visual scheduling and technician assignment.
- **Inventory**: Material tracking (rolls, kits) and consumption logging.
- **Reports**: Document generation for completed interventions and audits.
- **Admin/System**: Security, RBAC, and organization-wide settings.
- **Auth**: Secure session management and 2FA.

## Golden Paths (Start Here)
1. **[Domain Model](./01_DOMAIN_MODEL.md)**: Understand the core entities (Tasks, Interventions, etc.).
2. **[Architecture & Dataflows](./02_ARCHITECTURE_AND_DATAFLOWS.md)**: How data moves from the UI to SQLite.
3. **[Frontend Guide](./03_FRONTEND_GUIDE.md)**: Conventions for UI development.
4. **[Backend Guide](./04_BACKEND_GUIDE.md)**: Conventions for Rust domain development.
5. **[IPC API & Contracts](./05_IPC_API_AND_CONTRACTS.md)**: The bridge between Frontend and Backend.
