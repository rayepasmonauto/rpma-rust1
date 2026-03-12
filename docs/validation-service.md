---
title: "Validation Service"
summary: "Centralized validation with domain-specific validators for fields, GPS, business rules, and security"
read_when:
* Adding new input fields
* Implementing form validation
* Creating business rules
* Understanding validation layers
---

## Overview

Validation is centralized in a shared service with domain-specific submodules. **Backend validation is authoritative** - frontend validates for UX but backend enforces all rules.

**Related ADRs**: [ADR-015](./adr/015-validation-service.md)

## Module Structure

Location: `src-tauri/src/shared/services/validation/`

```
src-tauri/src/shared/services/validation/
├── mod.rs                # Module index
├── field_validators.rs   # Email, password, username, name
├── sanitizers.rs         # Input sanitization and formatting
├── gps_validators.rs     # GPS coordinates and accuracy
├── business_validators.rs# Task, client, auth workflow rules
├── security_validators.rs# Enhanced security validation
└── tests.rs              # Validation tests
```

## Error Types

```rust
#[derive(Error, Debug)]
pub enum ValidationError {
    #[error("Invalid email format: {0}")]
    InvalidEmail(String),
    
    #[error("Password too weak: {0}")]
    WeakPassword(String),
    
    #[error("Invalid username: {0}")]
    InvalidUsername(String),
    
    #[error("Invalid GPS coordinates: {0}")]
    InvalidGPSCoordinates(String),
    
    #[error("GPS accuracy too low: {accuracy}m (minimum: {required}m)")]
    GPSAccuracyTooLow { accuracy: f64, required: f64 },
    
    #[error("Input too long: {field} (max {max} characters)")]
    InputTooLong { field: String, max: usize },
    
    #[error("Invalid status transition from {from} to {to}")]
    InvalidTransition { from: String, to: String },
}
```

## Field Validators

Location: `src-tauri/src/shared/services/validation/field_validators.rs`

### Email Validation

```rust
pub fn validate_email(email: &str) -> Result<(), ValidationError> {
    let email_regex = Regex::new(r"^[^\s@]+@[^\s@]+\.[^\s@]+$").unwrap();
    if !email_regex.is_match(email) {
        return Err(ValidationError::InvalidEmail(email.to_string()));
    }
    Ok(())
}
```

### Password Validation

```rust
pub fn validate_password(password: &str) -> Result<(), ValidationError> {
    if password.len() < 8 {
        return Err(ValidationError::WeakPassword(
            "Must be at least 8 characters".into()
        ));
    }
    if !password.chars().any(|c| c.is_uppercase()) {
        return Err(ValidationError::WeakPassword(
            "Must contain uppercase letter".into()
        ));
    }
    if !password.chars().any(|c| c.is_numeric()) {
        return Err(ValidationError::WeakPassword(
            "Must contain a number".into()
        ));
    }
    Ok(())
}
```

### Name Validation

```rust
pub fn validate_name(name: &str, field: &str, max_length: usize) -> Result<(), ValidationError> {
    if name.trim().is_empty() {
        return Err(ValidationError::Required(field.to_string()));
    }
    if name.len() > max_length {
        return Err(ValidationError::InputTooLong {
            field: field.to_string(),
            max: max_length,
        });
    }
    Ok(())
}
```

## GPS Validators

Location: `src-tauri/src/shared/services/validation/gps_validators.rs`

### Coordinate Validation

```rust
pub fn validate_gps_coordinates(lat: f64, lng: f64) -> Result<(), ValidationError> {
    if !(-90.0..=90.0).contains(&lat) {
        return Err(ValidationError::InvalidGPSCoordinates(
            format!("Latitude {} out of range [-90, 90]", lat)
        ));
    }
    if !(-180.0..=180.0).contains(&lng) {
        return Err(ValidationError::InvalidGPSCoordinates(
            format!("Longitude {} out of range [-180, 180]", lng)
        ));
    }
    Ok(())
}
```

### Accuracy Validation

```rust
pub fn validate_gps_accuracy(accuracy: f64, min_required: f64) -> Result<(), ValidationError> {
    if accuracy > min_required {
        return Err(ValidationError::GPSAccuracyTooLow {
            accuracy,
            required: min_required,
        });
    }
    Ok(())
}
```

## Business Validators

Location: `src-tauri/src/shared/services/validation/business_validators.rs`

### Task Status Transitions

```rust
pub fn validate_task_status_transition(
    current: TaskStatus,
    new: TaskStatus,
) -> Result<(), ValidationError> {
    let valid_transitions = match current {
        TaskStatus::Pending => vec![TaskStatus::InProgress, TaskStatus::Cancelled],
        TaskStatus::InProgress => vec![TaskStatus::Completed, TaskStatus::OnHold, TaskStatus::Cancelled],
        TaskStatus::OnHold => vec![TaskStatus::InProgress, TaskStatus::Cancelled],
        TaskStatus::Completed => vec![],
        TaskStatus::Cancelled => vec![],
    };
    
    if !valid_transitions.contains(&new) {
        return Err(ValidationError::InvalidTransition {
            from: format!("{:?}", current),
            to: format!("{:?}", new),
        });
    }
    Ok(())
}
```

### Client Validation

```rust
pub fn validate_client(client: &CreateClientRequest) -> Result<(), ValidationError> {
    validate_name(&client.name, "Client name", 100)?;
    validate_email(&client.email)?;
    validate_phone(&client.phone)?;
    Ok(())
}
```

## Sanitizers

Location: `src-tauri/src/shared/services/validation/sanitizers.rs`

```rust
pub fn sanitize_string(input: &str) -> String {
    input.trim().to_string()
}

pub fn sanitize_html(input: &str) -> String {
    // Remove HTML tags and escape special characters
    html_escape(input)
}

pub fn sanitize_sql(input: &str) -> String {
    // Parameterized queries should be used instead, but this provides defense in depth
    input.replace('\'', "''")
}
```

## Two-Layer Validation

### Frontend (UX)

Frontend validates for immediate user feedback but is not authoritative.

Location: `frontend/src/lib/validation/`

```typescript
export function validateEmail(email: string): string | null {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return 'Invalid email format';
    }
    return null;
}

// Used in forms
const emailError = validateEmail(formData.email);
if (emailError) {
    setErrors({ email: emailError });
}
```

### Backend (Authoritative)

Backend validation is the source of truth.

```rust
// In domain/application layer
pub fn create_task(&self, ctx: &RequestContext, request: CreateTaskRequest) -> AppResult<Task> {
    // Validate all fields
    ValidationService::validate_title(&request.title)?;
    ValidationService::validate_gps(&request.location)?;
    
    // Business rules
    self.validate_client_exists(&request.client_id)?;
    self.validate_technician_available(&request.assigned_to)?;
    
    // Create task
    // ...
}
```

## Validation in IPC Layer

```rust
#[tauri::command]
pub async fn create_task(
    request: CreateTaskRequest,
    // ...
) -> Result<ApiResponse<Task>, AppError> {
    // Validate input
    validation::validate_task_request(&request)?;
    
    // Delegate to service
    let task = service.create_task(&ctx, request).await?;
    Ok(ApiResponse::success(task))
}
```

## Key Files

| Purpose | Location |
|---------|----------|
| Validation module | `src-tauri/src/shared/services/validation/mod.rs` |
| Field validators | `src-tauri/src/shared/services/validation/field_validators.rs` |
| GPS validators | `src-tauri/src/shared/services/validation/gps_validators.rs` |
| Business validators | `src-tauri/src/shared/services/validation/business_validators.rs` |
| Sanitizers | `src-tauri/src/shared/services/validation/sanitizers.rs` |
| Security validators | `src-tauri/src/shared/services/validation/security_validators.rs` |
| Frontend validation | `frontend/src/lib/validation/` |
