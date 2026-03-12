---
title: "Testing Requirements"
summary: "Mandatory testing policy with unit, integration, validation, and permission tests"
read_when:
* Adding new features
* Fixing bugs
* Understanding test structure
* Writing regression tests
---

## Overview

**Testing is mandatory, not optional.** All features must include tests for success paths, validation failures, and permission failures. Bug fixes must include regression tests.

**Related**: [AGENTS.md](../AGENTS.md) - Testing requirements section

## Test Categories

### 1. Unit Tests

Test individual functions, validators, and domain logic in isolation.

Location: `src-tauri/src/domains/*/tests/unit_*.rs`

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_task_status_transition_valid() {
        let result = validate_task_status_transition(
            TaskStatus::Pending,
            TaskStatus::InProgress
        );
        assert!(result.is_ok());
    }

    #[test]
    fn test_task_status_transition_invalid() {
        let result = validate_task_status_transition(
            TaskStatus::Completed,
            TaskStatus::InProgress
        );
        assert!(result.is_err());
    }
}
```

### 2. Integration Tests

Test full workflows including database operations.

Location: `src-tauri/src/domains/*/tests/integration_*.rs`

```rust
#[tokio::test]
async fn test_create_task_full_workflow() {
    let db = Database::new_in_memory().await.unwrap();
    let service = TaskService::new(db);
    
    let request = CreateTaskRequest {
        title: "Test Task".to_string(),
        client_id: "client-123".to_string(),
        // ...
    };
    
    let result = service.create_task(&ctx, request).await;
    assert!(result.is_ok());
    
    let task = result.unwrap();
    assert_eq!(task.title, "Test Task");
}
```

### 3. Validation Tests

Test input validation and business rule enforcement.

Location: `src-tauri/src/domains/*/tests/validation_*.rs`

```rust
#[test]
fn test_create_task_empty_title_fails() {
    let request = CreateTaskRequest {
        title: "".to_string(),
        // ...
    };
    
    let result = validate_create_task_request(&request);
    assert!(result.is_err());
}

#[test]
fn test_create_task_invalid_gps_fails() {
    let request = CreateTaskRequest {
        location: Some(GpsLocation { lat: 200.0, lng: 0.0 }),
        // ...
    };
    
    let result = validate_create_task_request(&request);
    assert!(matches!(result, Err(ValidationError::InvalidGPSCoordinates(_))));
}
```

### 4. Permission Tests

Test RBAC enforcement - every privileged action must be tested.

Location: `src-tauri/src/domains/*/tests/permission_*.rs`

```rust
#[tokio::test]
async fn test_delete_task_requires_admin_or_manager() {
    // Technician should fail
    let tech_ctx = RequestContext::with_role(UserRole::Technician);
    let result = service.delete_task(&tech_ctx, task_id).await;
    assert!(matches!(result, Err(AppError::Authorization(_))));
    
    // Manager should succeed
    let mgr_ctx = RequestContext::with_role(UserRole::Manager);
    let result = service.delete_task(&mgr_ctx, task_id).await;
    assert!(result.is_ok());
}

#[tokio::test]
async fn test_vacuum_database_requires_admin() {
    let mgr_ctx = RequestContext::with_role(UserRole::Manager);
    let result = vacuum_database_cmd(&mgr_ctx).await;
    assert!(matches!(result, Err(AppError::Authorization(_))));
}
```

## Test Structure by Domain

```
src-tauri/src/domains/tasks/tests/
├── mod.rs                  # Test module index
├── unit_tasks.rs           # Unit tests
├── integration_tasks.rs    # Integration tests
├── validation_tasks.rs     # Validation tests
└── permission_tasks.rs     # RBAC tests
```

## Running Tests

### Backend Tests

```bash
# All tests
make test

# Specific domain
cd src-tauri && cargo test --lib domains::tasks

# Specific test file
cd src-tauri && cargo test --test integration_tests

# Specific test
cd src-tauri && cargo test test_create_task_full_workflow
```

### Frontend Tests

```bash
# Unit tests
cd frontend && npm run test:ci

# E2E tests
cd frontend && npm run test:e2e
```

## Test Utilities

Location: `src-tauri/src/test_utils.rs`

```rust
pub fn create_test_context(role: UserRole) -> RequestContext {
    RequestContext::for_test("test-user", role)
}

pub async fn create_test_database() -> Database {
    Database::new_in_memory().await.unwrap()
}

pub fn create_test_task() -> Task {
    Task {
        id: Uuid::new_v4().to_string(),
        title: "Test Task".to_string(),
        // ...
    }
}
```

## Requirements Summary

| Change Type | Required Tests |
|-------------|----------------|
| New feature | Success path, validation failure, permission failure |
| Bug fix | Regression test (proves bug exists, proves fix works) |
| New IPC command | Success path, auth failure, validation failure |
| New validation | Valid input, invalid input, edge cases |
| New permission | Authorized success, unauthorized failure |

## Test Naming Convention

```rust
// Pattern: test_<function>_<scenario>_<expected_result>
#[test]
fn test_create_task_with_valid_input_succeeds() { }

#[test]
fn test_create_task_with_empty_title_fails() { }

#[test]
fn test_delete_task_as_technician_fails() { }
```

## Golden Tests

Frontend has golden path tests for critical flows.

Location: `frontend/src/__tests__/golden/`

```
frontend/src/__tests__/golden/
├── task.flow.test.ts
├── task-details.flow.test.ts
├── quote.flow.test.ts
└── auth.flow.test.ts
```

## Coverage Expectations

- **Domain logic**: 100% of business rules
- **Validators**: All validation paths
- **IPC commands**: All success and failure paths
- **Repositories**: CRUD operations and queries

## Key Files

| Purpose | Location |
|---------|----------|
| Test utilities | `src-tauri/src/test_utils.rs` |
| Domain tests | `src-tauri/src/domains/*/tests/` |
| Migration tests | `src-tauri/src/tests/migrations/` |
| Integration tests | `src-tauri/src/tests/integration/` |
| Performance tests | `src-tauri/src/tests/performance/` |
| Golden tests | `frontend/src/__tests__/golden/` |
