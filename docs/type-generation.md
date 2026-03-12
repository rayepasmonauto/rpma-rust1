---
title: "Type Generation"
summary: "Automatic TypeScript type generation from Rust via ts-rs"
read_when:
* Adding new IPC payload types
* Understanding generated types
* Running type sync
* Debugging type mismatches
---

## Overview

TypeScript types are auto-generated from Rust structs and enums using `ts-rs`. **Never manually edit generated types.** This ensures frontend and backend stay in sync.

**Related ADRs**: [ADR-003](./adr/003-typescript-type-generation.md)

## How It Works

1. Rust types are annotated with `#[derive(TS)]`
2. A binary exports types to TypeScript
3. Generated files live in `frontend/src/types/`
4. Frontend imports from generated types

## Rust Type Annotation

```rust
use ts_rs::TS;
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct Task {
    pub id: String,
    pub title: String,
    pub status: TaskStatus,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub enum TaskStatus {
    Pending,
    InProgress,
    Completed,
    OnHold,
    Cancelled,
}
```

### Common Attributes

```rust
#[ts(export)]                    // Export this type
#[ts(export_to = "tasks/")]      // Export to specific subdirectory
#[ts(type = "Task | null")]      // Override TypeScript type
#[ts(optional_fields)]           // Make all fields optional
```

## Generated Output

Location: `frontend/src/types/`

```typescript
// Auto-generated - DO NOT EDIT
export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
}

export type TaskStatus = "Pending" | "InProgress" | "Completed" | "OnHold" | "Cancelled";
```

## Type Export Binary

Location: `src-tauri/src/bin/export_types.rs`

```rust
fn main() {
    // Exports all types annotated with #[ts(export)]
    ts_rs::export_all!();
}
```

## Commands

### Sync Types

```bash
npm run types:sync
```

Regenerates all TypeScript types from Rust.

### Validate Types

```bash
npm run types:validate
```

Checks for drift between Rust and TypeScript.

### Drift Check

```bash
npm run types:drift-check
```

Identifies types that may be out of sync.

### Watch Mode

```bash
npm run types:watch
```

Auto-regenerates types on Rust file changes.

## Directory Structure

```
frontend/src/types/
├── index.ts              # Re-exports all types
├── task.types.ts         # Task-related types
├── client.types.ts       # Client types
├── auth.types.ts         # Auth types
├── quote.types.ts        # Quote types
├── workflow.types.ts     # Workflow types
├── settings.types.ts     # Settings types
├── calendar.ts           # Calendar types
├── photo.types.ts        # Photo types
├── intervention-extended.types.ts
├── ppf-intervention.ts
├── unified.ts            # Unified type aliases
├── api.ts                # API response types
├── database.types.ts     # Database types
├── configuration.types.ts
├── enums.ts              # Shared enums
└── json.ts               # JSON utility types
```

## Importing Generated Types

```typescript
// Good: Import from generated types
import type { Task, TaskStatus, CreateTaskRequest } from '@/types';

// Good: Import from domain types
import type { TaskQuery } from '@/domains/tasks/api/types';

// Bad: Manually defining types that exist in generated files
interface Task {
  id: string;
  // ...
}
```

## Adding New Types

1. **Define in Rust** with `#[derive(TS)]` and `#[ts(export)]`

```rust
// src-tauri/src/domains/tasks/domain/models/task.rs
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct CreateTaskRequest {
    pub title: String,
    pub client_id: String,
    pub scheduled_date: Option<String>,
}
```

2. **Run type sync**

```bash
npm run types:sync
```

3. **Import in frontend**

```typescript
import type { CreateTaskRequest } from '@/types';
```

## Cross-Domain Types

Types shared between domains should be in `shared/contracts/`:

```rust
// src-tauri/src/shared/contracts/auth.rs
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub enum UserRole {
    Admin,
    Manager,
    Technician,
    Viewer,
}
```

## Common Issues

### Type Not Generated

Ensure the type has `#[ts(export)]`:

```rust
#[derive(TS)]
#[ts(export)]  // Required!
pub struct MyType { ... }
```

### Circular Dependencies

Use `#[ts(type = "...")]` for complex recursive types:

```rust
#[derive(TS)]
#[ts(export, type = "Tree | null")]
pub struct Tree {
    pub value: i32,
    pub left: Option<Box<Tree>>,
    pub right: Option<Box<Tree>>,
}
```

### Generic Types

```rust
#[derive(TS)]
#[ts(export)]
pub struct PaginatedResult<T> {
    pub data: Vec<T>,
    pub pagination: PaginationInfo,
}
```

## Key Files

| Purpose | Location |
|---------|----------|
| Type export binary | `src-tauri/src/bin/export_types.rs` |
| Generated types | `frontend/src/types/` |
| Type index | `frontend/src/types/index.ts` |
| Domain types | `frontend/src/domains/*/api/types.ts` |
