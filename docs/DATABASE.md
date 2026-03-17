# Database Documentation

## Overview

**Database**: SQLite with WAL mode
**ORM**: Raw SQL via `rusqlite`
**Migrations**: Embedded numbered SQL files in `src-tauri/migrations/`
**Timestamps**: Milliseconds since Unix epoch

---

## Configuration

```rust
// Connection settings (src-tauri/src/db/connection.rs)
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA busy_timeout = 5000;
PRAGMA cache_size = -64000;  // 64MB
```

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                  USERS                                          │
│  ┌─────────────┐                                                                │
│  │ id          │─────────────────┬─────────────────────────────────────────────┐│
│  │ email       │                 │                                             ││
│  │ username    │                 │                                             ││
│  │ role        │                 │                                             ││
│  └─────────────┘                 │                                             ││
│         │                        │                                             ││
│         │ CASCADE                │SET NULL         │CASCADE                     ││
│         ▼                        ▼                        │                     ││
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐       │              ││
│  │  sessions   │      │    tasks    │      │user_settings│       │              ││
│  └─────────────┘      └─────────────┘      └─────────────┘       │              ││
│                              │                                   │              ││
│                              │ CASCADE                           │              ││
│                              ▼                                   │              ││
│                       ┌─────────────────┐                        │              ││
│                       │  interventions  │─────────────────────────┤              ││
│                       └─────────────────┘                        │              ││
│                              │ CASCADE                           │              ││
│              ┌───────────────┼───────────────┐                   │              ││
│              ▼               ▼               ▼                   │              ││
│       ┌───────────┐  ┌─────────────────┐  ┌─────────────────┐    │              ││
│       │photos     │  │intervention_steps│ │material_cons... │    │              ││
│       └───────────┘  └─────────────────┘  └─────────────────┘    │              ││
│                               │                                   │              ││
│                               │SET NULL                           │              ││
│                               ▼                                   │              ││
│                       ┌─────────────────┐                         │              ││
│                       │ inventory_trans │                         │              ││
│                       └─────────────────┘                         │              ││
└───────────────────────────────────────────────────────────────────┼──────────────┘│
                                                                    │              │
┌───────────────────────────────────────────────────────────────────┼──────────────┤
│  CLIENTS                                                          │              │
│  ┌─────────────┐                                                  │              │
│  │ id          │──────────────────────┬──────────────────────────┼──────────┐  │
│  │ name        │                      │                          │          │  │
│  │ email       │                      │                          │          │  │
│  │ phone       │                      │                          │          │  │
│  └─────────────┘                      │                          │          │  │
│         │                             │                          │          │  │
│         │SET NULL                      │CASCADE                   │          │  │
│         ▼                             ▼                          │          │  │
│  ┌─────────────┐              ┌─────────────┐                   │          │  │
│  │    tasks    │              │   quotes    │                   │          │  │
│  └─────────────┘              └─────────────┘                   │          │  │
│         │                             │ CASCADE                 │          │  │
│         │                             ▼                         │          │  │
│         │                      ┌─────────────┐                   │          │  │
│         │                      │ quote_items │                   │          │  │
│         │                      └─────────────┘                   │          │  │
│         │                                                        │          │  │
└─────────┼────────────────────────────────────────────────────────┼──────────┼──┘
          │                                                        │          │
          │CASCADE                                                 │RESTRICT  │
          ▼                                                        ▼          │
   ┌─────────────────┐                                      ┌─────────────┐    │
   │  calendar_events│                                      │  materials   │────┤
   └─────────────────┘                                      └─────────────┘    │
                                                                   │SET NULL   │
                                                                   │          │
       ┌───────────────────────────────────────────────────────────┘          │
       │                                                                       │
       ▼                                                                       │
┌─────────────────┐    CASCADE    ┌──────────────────┐                        │
│material_categories│◄────────────│    materials     │                        │
└─────────────────┘              └──────────────────┘                        │
                                        │SET NULL                             │
                                        │                                      │
                                        ▼                                      │
                                 ┌─────────────┐                               │
                                 │  suppliers  │◄──────────────────────────────┘
                                 └─────────────┘
```

---

## Tables

### users

User accounts and authentication.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| email | TEXT | NOT NULL UNIQUE | Email address |
| username | TEXT | NOT NULL UNIQUE | Username |
| password_hash | TEXT | NOT NULL | Argon2 hash |
| salt | TEXT | | Password salt |
| first_name | TEXT | NOT NULL DEFAULT '' | First name |
| last_name | TEXT | NOT NULL DEFAULT '' | Last name |
| full_name | TEXT | NOT NULL | Display name |
| role | TEXT | NOT NULL DEFAULT 'technician' CHECK(role IN ('admin', 'supervisor', 'technician', 'viewer')) | User role |
| phone | TEXT | | Phone number |
| is_active | INTEGER | NOT NULL DEFAULT 1 | Active status (0/1) |
| last_login_at | INTEGER | | Last login timestamp (ms) |
| login_count | INTEGER | DEFAULT 0 | Login counter |
| preferences | TEXT | | JSON preferences |
| synced | INTEGER | NOT NULL DEFAULT 0 | Sync status |
| last_synced_at | INTEGER | | Last sync timestamp |
| created_at | INTEGER | NOT NULL | Creation timestamp (ms) |
| updated_at | INTEGER | NOT NULL | Update timestamp (ms) |
| deleted_at | INTEGER | | Soft delete timestamp |

**Indexes**:
- `idx_users_email` ON (email)
- `idx_users_username` ON (username)
- `idx_users_role` ON (role)
- `idx_users_active` ON (is_active)
- `idx_users_role_active` ON (role, is_active)

---

### sessions

User session management.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | Session token (UUID) |
| user_id | TEXT | NOT NULL FK → users(id) CASCADE | Owner |
| username | TEXT | NOT NULL | Denormalized |
| email | TEXT | NOT NULL | Denormalized |
| role | TEXT | NOT NULL CHECK(role IN ('admin', 'supervisor', 'technician', 'viewer')) | User role |
| created_at | INTEGER | NOT NULL | Creation timestamp (ms) |
| expires_at | INTEGER | NOT NULL | Expiration timestamp (ms) |
| last_activity | INTEGER | NOT NULL | Last activity (ms) |

**Indexes**:
- `idx_sessions_user_id` ON (user_id)
- `idx_sessions_expires_at` ON (expires_at)

---

### clients

Customer/client information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| name | TEXT | NOT NULL | Full name |
| email | TEXT | | Email address |
| phone | TEXT | | Phone number |
| customer_type | TEXT | NOT NULL DEFAULT 'individual' CHECK(customer_type IN ('individual', 'business')) | Type |
| address_street | TEXT | | Street address |
| address_city | TEXT | | City |
| address_state | TEXT | | State/province |
| address_zip | TEXT | | Postal code |
| address_country | TEXT | DEFAULT 'France' | Country |
| tax_id | TEXT | | Tax ID |
| company_name | TEXT | | Company (business) |
| contact_person | TEXT | | Contact person |
| notes | TEXT | | Notes |
| tags | TEXT | | JSON array |
| total_tasks | INTEGER | DEFAULT 0 | Computed stat |
| active_tasks | INTEGER | DEFAULT 0 | Computed stat |
| completed_tasks | INTEGER | DEFAULT 0 | Computed stat |
| last_task_date | TEXT | | Last task date |
| created_at | INTEGER | NOT NULL | Creation (ms) |
| updated_at | INTEGER | NOT NULL | Update (ms) |
| created_by | TEXT | FK → users(id) | Creator |
| deleted_at | INTEGER | | Soft delete |
| deleted_by | TEXT | FK → users(id) | Deleter |
| synced | INTEGER | NOT NULL DEFAULT 0 | Sync status |
| last_synced_at | INTEGER | | Sync timestamp |

**Indexes**:
- `idx_clients_name` ON (name)
- `idx_clients_email` ON (email)
- `idx_clients_customer_type` ON (customer_type)
- `idx_clients_created_at` ON (created_at)
- `idx_clients_synced` ON (synced)
- `idx_clients_name_type_active` ON (name, customer_type, deleted_at)

**FTS5 Virtual Table**: `clients_fts` for full-text search on name, email, phone, company_name, contact_person, notes

---

### tasks

Task management with workflow support.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| task_number | TEXT | UNIQUE NOT NULL | Human-readable ID (e.g., TSK-0001) |
| title | TEXT | NOT NULL | Task title |
| description | TEXT | | Description |
| vehicle_plate | TEXT | | Vehicle plate |
| vehicle_model | TEXT | | Vehicle model |
| vehicle_year | TEXT | | Vehicle year |
| vehicle_make | TEXT | | Vehicle make |
| vin | TEXT | | VIN number |
| ppf_zones | TEXT | | JSON array of PPF zones |
| custom_ppf_zones | TEXT | | JSON array of custom zones |
| status | TEXT | NOT NULL DEFAULT 'draft' | Task status |
| priority | TEXT | NOT NULL DEFAULT 'medium' | Priority |
| technician_id | TEXT | FK → users(id) SET NULL | Assigned technician |
| assigned_at | INTEGER | | Assignment timestamp |
| assigned_by | TEXT | FK → users(id) | Assigner |
| scheduled_date | TEXT | | Scheduled date |
| start_time | TEXT | | Start time |
| end_time | TEXT | | End time |
| date_rdv | TEXT | | Appointment date |
| heure_rdv | TEXT | | Appointment time |
| template_id | TEXT | | Template FK |
| workflow_id | TEXT | FK → interventions(id) SET NULL | Linked intervention |
| workflow_status | TEXT | | Workflow status |
| current_workflow_step_id | TEXT | FK → intervention_steps(id) SET NULL | Current step |
| started_at | INTEGER | | Start timestamp |
| completed_at | INTEGER | | Completion timestamp |
| completed_steps | TEXT | | JSON array |
| client_id | TEXT | FK → clients(id) SET NULL | Client |
| customer_name | TEXT | | Denormalized |
| customer_email | TEXT | | Denormalized |
| customer_phone | TEXT | | Denormalized |
| customer_address | TEXT | | Denormalized |
| external_id | TEXT | | External reference |
| lot_film | TEXT | | Film lot |
| checklist_completed | INTEGER | DEFAULT 0 | Checklist status |
| notes | TEXT | | Notes |
| tags | TEXT | | JSON array |
| estimated_duration | INTEGER | | Duration estimate |
| actual_duration | INTEGER | | Actual duration |
| created_at | INTEGER | NOT NULL | Creation (ms) |
| updated_at | INTEGER | NOT NULL | Update (ms) |
| creator_id | TEXT | FK → users(id) | Creator |
| created_by | TEXT | FK → users(id) | Creator |
| updated_by | TEXT | FK → users(id) | Updater |
| deleted_at | INTEGER | | Soft delete |
| deleted_by | TEXT | FK → users(id) | Deleter |
| synced | INTEGER | DEFAULT 0 | Sync status |
| last_synced_at | INTEGER | | Sync timestamp |

**Status Values**: draft, scheduled, in_progress, completed, cancelled, on_hold, pending, invalid, archived, failed, overdue, assigned, paused

**Priority Values**: low, medium, high, urgent

**Indexes**:
- `idx_tasks_status` ON (status)
- `idx_tasks_client_id` ON (client_id)
- `idx_tasks_technician_id` ON (technician_id)
- `idx_tasks_status_technician` ON (status, technician_id)
- `idx_tasks_status_created` ON (status, created_at)
- `idx_tasks_deleted_at` ON (deleted_at)

---

### task_history

Task status transition audit trail.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| task_id | TEXT | NOT NULL FK → tasks(id) CASCADE | Task |
| old_status | TEXT | | Previous status |
| new_status | TEXT | NOT NULL | New status |
| reason | TEXT | | Reason for change |
| changed_at | INTEGER | NOT NULL | Change timestamp (ms) |
| changed_by | TEXT | FK → users(id) | User who changed |

**Indexes**:
- `idx_task_history_task_id` ON (task_id)
- `idx_task_history_changed_at` ON (changed_at)
- `idx_task_history_new_status` ON (new_status)
- `idx_task_history_changed_by` ON (changed_by)

---

### interventions

PPF intervention workflow records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| task_id | TEXT | NOT NULL FK → tasks(id) CASCADE | Task |
| task_number | TEXT | | Denormalized |
| status | TEXT | NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'paused', 'completed', 'cancelled')) | Status |
| vehicle_plate | TEXT | NOT NULL | Vehicle plate |
| vehicle_model | TEXT | | Vehicle model |
| vehicle_make | TEXT | | Vehicle make |
| vehicle_year | INTEGER | CHECK(vehicle_year BETWEEN 1900 AND 2100) | Year |
| vehicle_color | TEXT | | Vehicle color |
| vehicle_vin | TEXT | | VIN |
| client_id | TEXT | FK → clients(id) SET NULL | Client |
| client_name | TEXT | | Denormalized |
| client_email | TEXT | | Denormalized |
| client_phone | TEXT | | Denormalized |
| technician_id | TEXT | FK → users(id) SET NULL | Technician |
| technician_name | TEXT | | Denormalized |
| intervention_type | TEXT | NOT NULL DEFAULT 'ppf' | Type |
| current_step | INTEGER | NOT NULL DEFAULT 0 | Completed steps |
| completion_percentage | REAL | DEFAULT 0 CHECK(completion_percentage BETWEEN 0 AND 100) | Progress |
| ppf_zones_config | TEXT | | JSON zones config |
| ppf_zones_extended | TEXT | | JSON extended zones |
| film_type | TEXT | CHECK(film_type IN ('standard', 'premium', 'matte', 'colored')) | Film type |
| film_brand | TEXT | | Film brand |
| film_model | TEXT | | Film model |
| scheduled_at | INTEGER | | Scheduled (ms) |
| started_at | INTEGER | | Start (ms) |
| completed_at | INTEGER | | Completion (ms) |
| paused_at | INTEGER | | Pause (ms) |
| estimated_duration | INTEGER | | Estimate (minutes) |
| actual_duration | INTEGER | | Actual (minutes) |
| weather_condition | TEXT | CHECK(weather_condition IN ('sunny', 'cloudy', 'rainy', 'foggy', 'windy', 'other')) | Weather |
| lighting_condition | TEXT | CHECK(lighting_condition IN ('natural', 'artificial', 'mixed')) | Lighting |
| work_location | TEXT | CHECK(work_location IN ('indoor', 'outdoor', 'semi_covered')) | Location type |
| temperature_celsius | REAL | | Temperature |
| humidity_percentage | REAL | CHECK(humidity_percentage BETWEEN 0 AND 100) | Humidity |
| start_location_lat | REAL | CHECK(start_location_lat BETWEEN -90 AND 90) | GPS latitude |
| start_location_lon | REAL | CHECK(start_location_lon BETWEEN -180 AND 180) | GPS longitude |
| start_location_accuracy | REAL | | GPS accuracy |
| end_location_lat | REAL | CHECK(end_location_lat BETWEEN -90 AND 90) | End latitude |
| end_location_lon | REAL | CHECK(end_location_lon BETWEEN -180 AND 180) | End longitude |
| end_location_accuracy | REAL | | GPS accuracy |
| customer_satisfaction | INTEGER | CHECK(customer_satisfaction BETWEEN 1 AND 10) | Satisfaction |
| quality_score | INTEGER | CHECK(quality_score BETWEEN 0 AND 100) | Quality |
| final_observations | TEXT | | JSON array |
| customer_signature | TEXT | | Base64 signature |
| customer_comments | TEXT | | Comments |
| metadata | TEXT | | JSON metadata |
| notes | TEXT | | Notes |
| special_instructions | TEXT | | Special instructions |
| device_info | TEXT | | JSON device info |
| app_version | TEXT | | App version |
| synced | INTEGER | NOT NULL DEFAULT 0 | Sync status |
| last_synced_at | INTEGER | | Sync timestamp |
| sync_error | TEXT | | Sync error |
| created_at | INTEGER | NOT NULL | Creation (ms) |
| updated_at | INTEGER | NOT NULL | Update (ms) |
| created_by | TEXT | FK → users(id) | Creator |
| updated_by | TEXT | FK → users(id) | Updater |
| deleted_at | INTEGER | | Soft delete |
| deleted_by | TEXT | FK → users(id) | Deleter |

**Indexes**:
- `idx_interventions_task_id` ON (task_id)
- `idx_interventions_status` ON (status)
- `idx_interventions_client_id` ON (client_id)
- `idx_interventions_technician_id` ON (technician_id)

---

### intervention_steps

Workflow steps within interventions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| intervention_id | TEXT | NOT NULL FK → interventions(id) CASCADE | Intervention |
| step_number | INTEGER | NOT NULL | Step order |
| step_name | TEXT | NOT NULL | Step name |
| step_type | TEXT | NOT NULL CHECK(step_type IN ('inspection', 'preparation', 'installation', 'finalization')) | Type |
| step_status | TEXT | NOT NULL DEFAULT 'pending' CHECK(step_status IN ('pending', 'in_progress', 'paused', 'completed', 'failed', 'skipped', 'rework')) | Status |
| description | TEXT | | Description |
| instructions | TEXT | | JSON instructions |
| quality_checkpoints | TEXT | | JSON checkpoints |
| is_mandatory | INTEGER | NOT NULL DEFAULT 0 | Required flag |
| requires_photos | INTEGER | DEFAULT 0 | Photo requirement |
| min_photos_required | INTEGER | DEFAULT 0 | Min photos |
| max_photos_allowed | INTEGER | DEFAULT 20 | Max photos |
| started_at | INTEGER | | Start (ms) |
| completed_at | INTEGER | | Completion (ms) |
| paused_at | INTEGER | | Pause (ms) |
| duration_seconds | INTEGER | | Duration |
| estimated_duration_seconds | INTEGER | | Estimate |
| step_data | TEXT | | JSON step data |
| collected_data | TEXT | | JSON collected data |
| measurements | TEXT | | JSON measurements |
| observations | TEXT | | JSON observations |
| photo_count | INTEGER | NOT NULL DEFAULT 0 | Photo count |
| required_photos_completed | INTEGER | DEFAULT 0 | Required photos done |
| photo_urls | TEXT | | JSON photo URLs |
| validation_data | TEXT | | JSON validation |
| validation_errors | TEXT | | JSON errors |
| validation_score | INTEGER | CHECK(validation_score BETWEEN 0 AND 100) | Score |
| requires_supervisor_approval | INTEGER | DEFAULT 0 | Approval flag |
| approved_by | TEXT | FK → users(id) | Approver |
| approved_at | INTEGER | | Approval timestamp |
| rejection_reason | TEXT | | Rejection reason |
| location_lat | REAL | CHECK(location_lat BETWEEN -90 AND 90) | GPS latitude |
| location_lon | REAL | CHECK(location_lon BETWEEN -180 AND 180) | GPS longitude |
| location_accuracy | REAL | | GPS accuracy |
| device_timestamp | INTEGER | | Device time |
| server_timestamp | INTEGER | | Server time |
| title | TEXT | | Title |
| notes | TEXT | | Notes |
| synced | INTEGER | NOT NULL DEFAULT 0 | Sync status |
| last_synced_at | INTEGER | | Sync timestamp |
| created_at | INTEGER | NOT NULL | Creation (ms) |
| updated_at | INTEGER | NOT NULL | Update (ms) |

**Unique Index**: `idx_steps_intervention_number` ON (intervention_id, step_number)

---

### photos

Photos associated with interventions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| intervention_id | TEXT | NOT NULL FK → interventions(id) CASCADE | Intervention |
| step_id | TEXT | FK → intervention_steps(id) SET NULL | Step |
| step_number | INTEGER | | Step number |
| file_path | TEXT | NOT NULL | File path |
| file_name | TEXT | | Filename |
| file_size | INTEGER | | Size in bytes |
| mime_type | TEXT | DEFAULT 'image/jpeg' CHECK(mime_type IN ('image/jpeg', 'image/png', 'image/heic', 'image/webp')) | MIME type |
| width | INTEGER | | Image width |
| height | INTEGER | | Image height |
| photo_type | TEXT | CHECK(photo_type IN ('before', 'during', 'after')) | Type |
| photo_category | TEXT | | Category |
| photo_angle | TEXT | | Angle |
| zone | TEXT | | Zone |
| title | TEXT | | Title |
| description | TEXT | | Description |
| notes | TEXT | | Notes |
| annotations | TEXT | | JSON annotations |
| exif_data | TEXT | | JSON EXIF |
| camera_make | TEXT | | Camera make |
| camera_model | TEXT | | Camera model |
| capture_datetime | TEXT | | Capture time |
| gps_location_lat | REAL | CHECK(gps_location_lat BETWEEN -90 AND 90) | GPS latitude |
| gps_location_lon | REAL | CHECK(gps_location_lon BETWEEN -180 AND 180) | GPS longitude |
| gps_location_accuracy | REAL | | GPS accuracy |
| gps_altitude | REAL | | Altitude |
| quality_score | INTEGER | CHECK(quality_score BETWEEN 0 AND 100) | Quality score |
| blur_score | INTEGER | CHECK(blur_score BETWEEN 0 AND 100) | Blur score |
| exposure_score | INTEGER | CHECK(exposure_score BETWEEN 0 AND 100) | Exposure score |
| composition_score | INTEGER | CHECK(composition_score BETWEEN 0 AND 100) | Composition score |
| is_required | INTEGER | DEFAULT 0 | Required flag |
| is_approved | INTEGER | DEFAULT 1 | Approval status |
| approved_by | TEXT | FK → users(id) | Approver |
| approved_at | INTEGER | | Approval timestamp |
| rejection_reason | TEXT | | Rejection reason |
| synced | INTEGER | NOT NULL DEFAULT 0 | Sync status |
| storage_url | TEXT | | Cloud URL |
| upload_retry_count | INTEGER | DEFAULT 0 | Retry count |
| upload_error | TEXT | | Error message |
| last_synced_at | INTEGER | | Sync timestamp |
| captured_at | INTEGER | | Capture timestamp |
| uploaded_at | INTEGER | | Upload timestamp |
| created_at | INTEGER | NOT NULL | Creation (ms) |
| updated_at | INTEGER | NOT NULL | Update (ms) |
| deleted_at | INTEGER | | Soft delete |
| deleted_by | TEXT | FK → users(id) | Deleter |

---

### quotes

Quote/Devis management for PPF services.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| quote_number | TEXT | NOT NULL UNIQUE | Quote number |
| client_id | TEXT | NOT NULL FK → clients(id) | Client |
| task_id | TEXT | FK → tasks(id) | Task |
| status | TEXT | NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'sent', 'accepted', 'rejected', 'expired', 'changes_requested')) | Status |
| valid_until | INTEGER | | Expiration (ms) |
| description | TEXT | | Public description |
| notes | TEXT | | Internal notes |
| terms | TEXT | | Terms and conditions |
| subtotal | INTEGER | NOT NULL DEFAULT 0 | Subtotal (cents) |
| tax_total | INTEGER | NOT NULL DEFAULT 0 | Tax total (cents) |
| total | INTEGER | NOT NULL DEFAULT 0 | Grand total (cents) |
| discount_type | TEXT | | Discount type |
| discount_value | INTEGER | | Discount value |
| discount_amount | INTEGER | | Discount amount |
| vehicle_plate | TEXT | | Vehicle plate |
| vehicle_make | TEXT | | Vehicle make |
| vehicle_model | TEXT | | Vehicle model |
| vehicle_year | TEXT | | Vehicle year |
| vehicle_vin | TEXT | | VIN |
| public_token | TEXT | | Public sharing token |
| shared_at | INTEGER | | Share timestamp |
| view_count | INTEGER | NOT NULL DEFAULT 0 | View counter |
| last_viewed_at | INTEGER | | Last view (ms) |
| customer_message | TEXT | | Customer message |
| created_at | INTEGER | NOT NULL | Creation (ms) |
| updated_at | INTEGER | NOT NULL | Update (ms) |
| created_by | TEXT | FK → users(id) | Creator |
| deleted_at | INTEGER | | Soft delete |
| deleted_by | TEXT | FK → users(id) | Deleter |

**Indexes**:
- `idx_quotes_quote_number` ON (quote_number)
- `idx_quotes_client_id` ON (client_id)
- `idx_quotes_status` ON (status)
- `idx_quotes_created_at` ON (created_at)
- `idx_quotes_task_id` ON (task_id)
- `idx_quotes_public_token` ON (public_token)

---

### quote_items

Line items within quotes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| quote_id | TEXT | NOT NULL FK → quotes(id) CASCADE | Quote |
| kind | TEXT | NOT NULL DEFAULT 'service' CHECK(kind IN ('labor', 'material', 'service', 'discount')) | Item type |
| label | TEXT | NOT NULL | Description |
| description | TEXT | | Detailed description |
| qty | REAL | NOT NULL DEFAULT 1 | Quantity |
| unit_price | INTEGER | NOT NULL DEFAULT 0 | Unit price (cents) |
| tax_rate | REAL | | Tax rate percentage |
| material_id | TEXT | FK → materials(id) | Material link |
| position | INTEGER | NOT NULL DEFAULT 0 | Sort order |
| created_at | INTEGER | NOT NULL | Creation (ms) |
| updated_at | INTEGER | NOT NULL | Update (ms) |

**Indexes**:
- `idx_quote_items_quote_id` ON (quote_id)
- `idx_quote_items_position` ON (position)
- `idx_quote_items_material_id` ON (material_id)

---

### quote_attachments

File attachments for quotes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| quote_id | TEXT | NOT NULL FK → quotes(id) CASCADE | Quote |
| file_name | TEXT | NOT NULL | Original filename |
| file_path | TEXT | NOT NULL | Storage path |
| file_size | INTEGER | NOT NULL | Size in bytes |
| mime_type | TEXT | NOT NULL | MIME type |
| attachment_type | TEXT | NOT NULL DEFAULT 'other' CHECK(attachment_type IN ('image', 'document', 'other')) | Type |
| description | TEXT | | Description |
| created_at | INTEGER | NOT NULL | Creation (ms) |
| created_by | TEXT | FK → users(id) | Creator |

---

### materials

Material inventory management.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| sku | TEXT | NOT NULL UNIQUE | Stock keeping unit |
| name | TEXT | NOT NULL | Material name |
| description | TEXT | | Description |
| material_type | TEXT | NOT NULL CHECK(material_type IN ('ppf_film', 'adhesive', 'cleaning_solution', 'tool', 'consumable')) | Type |
| category | TEXT | | Category name |
| subcategory | TEXT | | Subcategory |
| category_id | TEXT | FK → material_categories(id) SET NULL | Category FK |
| brand | TEXT | | Brand |
| model | TEXT | | Model |
| specifications | TEXT | | JSON specs |
| unit_of_measure | TEXT | NOT NULL DEFAULT 'piece' CHECK(unit_of_measure IN ('piece', 'meter', 'liter', 'gram', 'roll')) | Unit |
| current_stock | REAL | NOT NULL DEFAULT 0 CHECK(current_stock >= 0) | Current stock |
| minimum_stock | REAL | DEFAULT 0 CHECK(minimum_stock >= 0) | Min stock |
| maximum_stock | REAL | CHECK(maximum_stock >= 0) | Max stock |
| reorder_point | REAL | CHECK(reorder_point >= 0) | Reorder point |
| unit_cost | REAL | | Cost per unit |
| currency | TEXT | DEFAULT 'EUR' | Currency |
| supplier_id | TEXT | FK → suppliers(id) SET NULL | Supplier |
| supplier_name | TEXT | | Denormalized |
| supplier_sku | TEXT | | Supplier SKU |
| quality_grade | TEXT | | Quality grade |
| certification | TEXT | | Certification |
| expiry_date | INTEGER | | Expiry (ms) |
| batch_number | TEXT | | Batch number |
| serial_numbers | TEXT | | JSON array |
| is_active | INTEGER | NOT NULL DEFAULT 1 | Active flag |
| is_discontinued | INTEGER | NOT NULL DEFAULT 0 | Discontinued flag |
| storage_location | TEXT | | Location |
| warehouse_id | TEXT | | Warehouse |
| created_at | INTEGER | NOT NULL | Creation (ms) |
| updated_at | INTEGER | NOT NULL | Update (ms) |
| created_by | TEXT | FK → users(id) SET NULL | Creator |
| updated_by | TEXT | FK → users(id) SET NULL | Updater |
| deleted_at | INTEGER | | Soft delete |
| deleted_by | TEXT | FK → users(id) | Deleter |
| synced | INTEGER | NOT NULL DEFAULT 0 | Sync status |
| last_synced_at | INTEGER | | Sync timestamp |

**Indexes**:
- `idx_materials_sku` ON (sku)
- `idx_materials_type` ON (material_type)
- `idx_materials_category` ON (category_id)
- `idx_materials_supplier` ON (supplier_id)
- `idx_materials_active` ON (is_active)

---

### material_categories

Hierarchical material classification.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| name | TEXT | NOT NULL | Category name |
| code | TEXT | UNIQUE | Category code |
| parent_id | TEXT | FK → material_categories(id) CASCADE | Parent category |
| level | INTEGER | NOT NULL DEFAULT 1 | Hierarchy level |
| description | TEXT | | Description |
| color | TEXT | | Hex color for UI |
| is_active | INTEGER | NOT NULL DEFAULT 1 | Active flag |
| created_at | INTEGER | NOT NULL | Creation (ms) |
| updated_at | INTEGER | NOT NULL | Update (ms) |
| created_by | TEXT | FK → users(id) SET NULL | Creator |
| updated_by | TEXT | FK → users(id) SET NULL | Updater |
| synced | INTEGER | NOT NULL DEFAULT 0 | Sync status |
| last_synced_at | INTEGER | | Sync timestamp |

**Seeds**: PPF Films, Adhesives, Cleaning Solutions, Tools & Equipment, Consumables

---

### suppliers

Material supplier information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| name | TEXT | NOT NULL | Supplier name |
| code | TEXT | UNIQUE | Supplier code |
| contact_person | TEXT | | Contact person |
| email | TEXT | | Email |
| phone | TEXT | | Phone |
| website | TEXT | | Website |
| address_street | TEXT | | Street |
| address_city | TEXT | | City |
| address_state | TEXT | | State |
| address_zip | TEXT | | Postal code |
| address_country | TEXT | | Country |
| tax_id | TEXT | | Tax ID |
| business_license | TEXT | | Business license |
| payment_terms | TEXT | | Payment terms |
| lead_time_days | INTEGER | DEFAULT 0 | Lead time |
| is_active | INTEGER | NOT NULL DEFAULT 1 | Active flag |
| is_preferred | INTEGER | NOT NULL DEFAULT 0 | Preferred flag |
| quality_rating | REAL | DEFAULT 0.0 CHECK(quality_rating BETWEEN 0.0 AND 5.0) | Rating |
| delivery_rating | REAL | DEFAULT 0.0 CHECK(delivery_rating BETWEEN 0.0 AND 5.0) | Delivery rating |
| on_time_delivery_rate | REAL | DEFAULT 0.0 CHECK(on_time_delivery_rate BETWEEN 0.0 AND 100.0) | On-time rate |
| notes | TEXT | | Notes |
| special_instructions | TEXT | | Special instructions |
| created_at | INTEGER | NOT NULL | Creation (ms) |
| updated_at | INTEGER | NOT NULL | Update (ms) |
| created_by | TEXT | FK → users(id) SET NULL | Creator |
| updated_by | TEXT | FK → users(id) SET NULL | Updater |
| synced | INTEGER | NOT NULL DEFAULT 0 | Sync status |
| last_synced_at | INTEGER | | Sync timestamp |

---

### material_consumption

Material usage per intervention.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| intervention_id | TEXT | NOT NULL FK → interventions(id) CASCADE | Intervention |
| material_id | TEXT | NOT NULL FK → materials(id) RESTRICT | Material |
| step_id | TEXT | FK → intervention_steps(id) SET NULL | Step |
| quantity_used | REAL | NOT NULL CHECK(quantity_used >= 0) | Quantity |
| unit_cost | REAL | | Cost per unit |
| total_cost | REAL | | Total cost |
| waste_quantity | REAL | DEFAULT 0 CHECK(waste_quantity >= 0) | Waste |
| waste_reason | TEXT | | Waste reason |
| batch_used | TEXT | | Batch number |
| expiry_used | INTEGER | | Expiry timestamp |
| quality_notes | TEXT | | Quality notes |
| step_number | INTEGER | | Step number |
| recorded_by | TEXT | FK → users(id) SET NULL | Recorder |
| recorded_at | INTEGER | NOT NULL | Recording (ms) |
| created_at | INTEGER | NOT NULL | Creation (ms) |
| updated_at | INTEGER | NOT NULL | Update (ms) |
| synced | INTEGER | NOT NULL DEFAULT 0 | Sync status |
| last_synced_at | INTEGER | | Sync timestamp |

---

### inventory_transactions

All inventory movements.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| material_id | TEXT | NOT NULL FK → materials(id) RESTRICT | Material |
| transaction_type | TEXT | NOT NULL CHECK(transaction_type IN ('stock_in', 'stock_out', 'adjustment', 'transfer', 'waste', 'return')) | Type |
| quantity | REAL | NOT NULL CHECK(quantity >= 0) | Quantity |
| previous_stock | REAL | NOT NULL CHECK(previous_stock >= 0) | Previous stock |
| new_stock | REAL | NOT NULL CHECK(new_stock >= 0) | New stock |
| reference_number | TEXT | | PO number, intervention ID |
| reference_type | TEXT | | 'purchase_order', 'intervention', 'manual_adjustment' |
| notes | TEXT | | Notes |
| unit_cost | REAL | | Unit cost |
| total_cost | REAL | | Total cost |
| warehouse_id | TEXT | | Warehouse |
| location_from | TEXT | | Source location |
| location_to | TEXT | | Destination location |
| batch_number | TEXT | | Batch number |
| expiry_date | INTEGER | | Expiry (ms) |
| quality_status | TEXT | | Quality status |
| intervention_id | TEXT | FK → interventions(id) SET NULL | Intervention |
| step_id | TEXT | FK → intervention_steps(id) SET NULL | Step |
| performed_by | TEXT | NOT NULL FK → users(id) RESTRICT | User |
| performed_at | INTEGER | NOT NULL | Transaction (ms) |
| created_at | INTEGER | NOT NULL | Creation (ms) |
| updated_at | INTEGER | NOT NULL | Update (ms) |
| synced | INTEGER | NOT NULL DEFAULT 0 | Sync status |
| last_synced_at | INTEGER | | Sync timestamp |

---

### user_settings

User preferences and settings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| user_id | TEXT | NOT NULL UNIQUE FK → users(id) CASCADE | User |
| full_name | TEXT | | Display name |
| email | TEXT | | Email |
| phone | TEXT | | Phone |
| avatar_url | TEXT | | Avatar URL |
| notes | TEXT | | Notes |
| email_notifications | INTEGER | NOT NULL DEFAULT 1 | Boolean |
| push_notifications | INTEGER | NOT NULL DEFAULT 1 | Boolean |
| task_assignments | INTEGER | NOT NULL DEFAULT 1 | Boolean |
| task_updates | INTEGER | NOT NULL DEFAULT 1 | Boolean |
| system_alerts | INTEGER | NOT NULL DEFAULT 1 | Boolean |
| weekly_reports | INTEGER | NOT NULL DEFAULT 0 | Boolean |
| theme | TEXT | NOT NULL DEFAULT 'system' | Theme |
| language | TEXT | NOT NULL DEFAULT 'fr' | Language |
| date_format | TEXT | NOT NULL DEFAULT 'DD/MM/YYYY' | Date format |
| time_format | TEXT | NOT NULL DEFAULT '24h' | Time format |
| high_contrast | INTEGER | NOT NULL DEFAULT 0 | Boolean |
| large_text | INTEGER | NOT NULL DEFAULT 0 | Boolean |
| reduce_motion | INTEGER | NOT NULL DEFAULT 0 | Boolean |
| screen_reader | INTEGER | NOT NULL DEFAULT 0 | Boolean |
| auto_refresh | INTEGER | NOT NULL DEFAULT 1 | Boolean |
| refresh_interval | INTEGER | NOT NULL DEFAULT 60 | Seconds |
| two_factor_enabled | INTEGER | NOT NULL DEFAULT 0 | Boolean |
| session_timeout | INTEGER | NOT NULL DEFAULT 480 | Minutes |
| cache_enabled | INTEGER | NOT NULL DEFAULT 1 | Boolean |
| cache_size | INTEGER | NOT NULL DEFAULT 100 | MB |
| offline_mode | INTEGER | NOT NULL DEFAULT 0 | Boolean |
| sync_on_startup | INTEGER | NOT NULL DEFAULT 1 | Boolean |
| background_sync | INTEGER | NOT NULL DEFAULT 1 | Boolean |
| image_compression | INTEGER | NOT NULL DEFAULT 1 | Boolean |
| preload_data | INTEGER | NOT NULL DEFAULT 0 | Boolean |
| created_at | INTEGER | NOT NULL | Creation (ms) |
| updated_at | INTEGER | NOT NULL | Update (ms) |

---

### settings_audit_log

User settings change audit.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| user_id | TEXT | NOT NULL FK → users(id) CASCADE | User |
| setting_type | TEXT | NOT NULL | Setting category |
| details | TEXT | NOT NULL | JSON details |
| timestamp | INTEGER | NOT NULL | Change timestamp (ms) |
| ip_address | TEXT | | IP address |
| user_agent | TEXT | | User agent |

---

### user_consent

GDPR consent preferences.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Auto ID |
| user_id | TEXT | NOT NULL UNIQUE FK → users(id) CASCADE | User |
| consent_data | TEXT | NOT NULL | JSON consent data |
| updated_at | INTEGER | NOT NULL | Update timestamp (ms) |
| created_at | INTEGER | NOT NULL | Creation timestamp (ms) |

---

### messages

Message queue for notifications.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| message_type | TEXT | NOT NULL CHECK(message_type IN ('email', 'sms', 'in_app')) | Type |
| sender_id | TEXT | FK → users(id) SET NULL | Sender |
| recipient_id | TEXT | FK → users(id) CASCADE | Recipient |
| recipient_email | TEXT | | Email recipient |
| recipient_phone | TEXT | | Phone recipient |
| subject | TEXT | | Subject |
| body | TEXT | NOT NULL | Message body |
| template_id | TEXT | FK → message_templates(id) SET NULL | Template |
| task_id | TEXT | FK → tasks(id) CASCADE | Task |
| client_id | TEXT | FK → clients(id) CASCADE | Client |
| status | TEXT | NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'sent', 'delivered', 'failed', 'read')) | Status |
| priority | TEXT | DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'urgent')) | Priority |
| scheduled_at | INTEGER | | Scheduled (ms) |
| sent_at | INTEGER | | Sent (ms) |
| read_at | INTEGER | | Read (ms) |
| error_message | TEXT | | Error |
| metadata | TEXT | | JSON metadata |
| created_at | INTEGER | NOT NULL | Creation (ms) |
| updated_at | INTEGER | NOT NULL | Update (ms) |

---

### notifications

In-app notifications.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| type | TEXT | NOT NULL | Notification type |
| title | TEXT | NOT NULL | Title |
| message | TEXT | NOT NULL | Message |
| entity_type | TEXT | NOT NULL | Entity type |
| entity_id | TEXT | NOT NULL | Entity ID |
| entity_url | TEXT | NOT NULL | URL |
| read | INTEGER | DEFAULT 0 | Read status |
| user_id | TEXT | NOT NULL FK → users(id) CASCADE | User |
| created_at | INTEGER | NOT NULL | Creation (ms) |

---

### organizations

Organization/business settings (single-row).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY DEFAULT 'default' CHECK(id = 'default') | Always 'default' |
| name | TEXT | NOT NULL | Organization name |
| slug | TEXT | UNIQUE | URL slug |
| legal_name | TEXT | | Legal name |
| tax_id | TEXT | | Tax ID |
| siret | TEXT | | SIRET |
| registration_number | TEXT | | Registration |
| email | TEXT | | Email |
| phone | TEXT | | Phone |
| website | TEXT | | Website |
| address_street | TEXT | | Street |
| address_city | TEXT | | City |
| address_state | TEXT | | State |
| address_zip | TEXT | | Postal code |
| address_country | TEXT | DEFAULT 'France' | Country |
| logo_url | TEXT | | Logo URL |
| logo_data | TEXT | | Base64 logo |
| primary_color | TEXT | DEFAULT '#3B82F6' | Primary color |
| secondary_color | TEXT | DEFAULT '#1E40AF' | Secondary color |
| accent_color | TEXT | | Accent color |
| business_settings | TEXT | DEFAULT '{}' | JSON settings |
| invoice_settings | TEXT | DEFAULT '{}' | JSON settings |
| industry | TEXT | | Industry |
| company_size | TEXT | | Size |
| created_at | INTEGER | NOT NULL | Creation (ms) |
| updated_at | INTEGER | NOT NULL | Update (ms) |

---

### organization_settings

Flexible key-value settings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| key | TEXT | PRIMARY KEY | Setting key |
| value | TEXT | NOT NULL | Setting value |
| category | TEXT | NOT NULL DEFAULT 'general' | Category |
| updated_at | INTEGER | NOT NULL | Update timestamp (ms) |

**Seeds**: onboarding_completed, date_format, time_format, currency, language, timezone, invoice_prefix, quote_prefix, business_hours, etc.

---

### login_attempts

Rate limiting for login attempts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| identifier | TEXT | NOT NULL | Email or username |
| attempt_count | INTEGER | NOT NULL DEFAULT 1 | Number of attempts |
| first_attempt | TEXT | NOT NULL | First attempt timestamp |
| last_attempt | TEXT | NOT NULL | Last attempt timestamp |
| is_locked | INTEGER | NOT NULL DEFAULT 0 | Lock status |
| lock_until | TEXT | | Lock expiration |
| created_at | TEXT | NOT NULL | Creation timestamp |
| updated_at | TEXT | NOT NULL | Update timestamp |

**Indexes**:
- `idx_login_attempts_identifier` ON (identifier)
- `idx_login_attempts_last_attempt` ON (last_attempt)

---

### audit_events

Comprehensive security audit.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| event_type | TEXT | NOT NULL | Event type |
| user_id | TEXT | NOT NULL FK → users(id) | User |
| action | TEXT | NOT NULL | Action |
| resource_id | TEXT | | Resource ID |
| resource_type | TEXT | | Resource type |
| description | TEXT | NOT NULL | Description |
| ip_address | TEXT | | IP address |
| user_agent | TEXT | | User agent |
| result | TEXT | NOT NULL | Result |
| previous_state | TEXT | | JSON previous |
| new_state | TEXT | | JSON new |
| timestamp | INTEGER | NOT NULL | Timestamp (ms) |
| metadata | TEXT | | JSON metadata |
| session_id | TEXT | | Session ID |
| request_id | TEXT | | Request ID |
| created_at | INTEGER | | Creation (ms) |

---

### calendar_events

Calendar/scheduling.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| title | TEXT | NOT NULL | Event title |
| description | TEXT | | Description |
| start_datetime | TEXT | NOT NULL | ISO 8601 start |
| end_datetime | TEXT | NOT NULL | ISO 8601 end |
| all_day | INTEGER | NOT NULL DEFAULT 0 | Boolean |
| timezone | TEXT | DEFAULT 'UTC' | Timezone |
| event_type | TEXT | NOT NULL DEFAULT 'meeting' CHECK(event_type IN ('meeting', 'appointment', 'task', 'reminder', 'other')) | Type |
| category | TEXT | | Category |
| task_id | TEXT | FK → tasks(id) CASCADE | Task |
| client_id | TEXT | FK → clients(id) SET NULL | Client |
| technician_id | TEXT | FK → users(id) CASCADE | Technician |
| location | TEXT | | Location |
| meeting_link | TEXT | | Virtual link |
| is_virtual | INTEGER | DEFAULT 0 | Boolean |
| participants | TEXT | | JSON array |
| is_recurring | INTEGER | DEFAULT 0 | Boolean |
| recurrence_rule | TEXT | | RRULE format |
| parent_event_id | TEXT | FK → calendar_events(id) CASCADE | Parent event |
| reminders | TEXT | | JSON array |
| status | TEXT | NOT NULL DEFAULT 'confirmed' CHECK(status IN ('confirmed', 'tentative', 'cancelled')) | Status |
| color | TEXT | | Hex color |
| tags | TEXT | | JSON array |
| notes | TEXT | | Notes |
| synced | INTEGER | NOT NULL DEFAULT 0 | Sync status |
| last_synced_at | INTEGER | | Sync timestamp |
| created_at | INTEGER | NOT NULL | Creation (ms) |
| updated_at | INTEGER | NOT NULL | Update (ms) |
| created_by | TEXT | FK → users(id) | Creator |
| updated_by | TEXT | FK → users(id) | Updater |
| deleted_at | INTEGER | | Soft delete |
| deleted_by | TEXT | FK → users(id) | Deleter |

---

### sync_queue

Offline sync queue.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Auto ID |
| operation_type | TEXT | NOT NULL CHECK(operation_type IN ('create', 'update', 'delete')) | Operation |
| entity_type | TEXT | NOT NULL CHECK(entity_type IN ('task', 'client', 'intervention', 'photo')) | Entity |
| entity_id | TEXT | NOT NULL | Entity UUID |
| data | TEXT | NOT NULL | JSON payload |
| dependencies | TEXT | | JSON dependency IDs |
| retry_count | INTEGER | NOT NULL DEFAULT 0 | Retry count |
| max_retries | INTEGER | NOT NULL DEFAULT 3 | Max retries |
| last_retry_at | INTEGER | | Last retry (ms) |
| next_retry_at | INTEGER | | Next retry (ms) |
| last_error | TEXT | | Error message |
| status | TEXT | NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed', 'abandoned')) | Status |
| priority | INTEGER | NOT NULL DEFAULT 5 CHECK(priority BETWEEN 1 AND 10) | Priority |
| user_id | TEXT | FK → users(id) SET NULL | User |
| device_id | TEXT | | Device ID |
| batch_id | TEXT | | Batch ID |
| timestamp_utc | INTEGER | | Timestamp |
| created_at | INTEGER | NOT NULL | Creation (ms) |
| updated_at | INTEGER | | Update (ms) |
| processed_at | INTEGER | | Processed (ms) |

---

## Views

### client_statistics

```sql
CREATE VIEW client_statistics AS
SELECT 
  c.id, c.name, c.customer_type, c.created_at,
  COUNT(DISTINCT t.id) as total_tasks,
  COUNT(DISTINCT CASE WHEN t.status IN ('pending', 'in_progress') THEN t.id END) as active_tasks,
  COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks,
  MAX(t.updated_at) as last_task_date
FROM clients c
LEFT JOIN tasks t ON t.client_id = c.id AND t.deleted_at IS NULL
WHERE c.deleted_at IS NULL
GROUP BY c.id;
```

---

## Foreign Key Relationships

| Parent Table | Child Table | FK Column | Delete Action |
|--------------|-------------|-----------|---------------|
| users | sessions | user_id | CASCADE |
| users | tasks | technician_id, created_by, updated_by | SET NULL |
| users | interventions | technician_id, created_by, updated_by | SET NULL |
| users | interventions | deleted_by | SET NULL |
| users | intervention_steps | approved_by | SET NULL |
| users | photos | approved_by, deleted_by | SET NULL |
| users | material_consumption | recorded_by | SET NULL |
| users | inventory_transactions | performed_by | RESTRICT |
| users | suppliers | created_by, updated_by | SET NULL |
| users | material_categories | created_by, updated_by | SET NULL |
| users | materials | created_by, updated_by, deleted_by | SET NULL |
| users | user_settings | user_id | CASCADE |
| users | settings_audit_log | user_id | CASCADE |
| users | user_consent | user_id | CASCADE |
| users | audit_events | user_id | RESTRICT |
| users | notifications | user_id | CASCADE |
| users | calendar_events | technician_id, created_by, updated_by, deleted_by | CASCADE / SET NULL |
| users | sync_queue | user_id | SET NULL |
| clients | tasks | client_id | SET NULL |
| clients | interventions | client_id | SET NULL |
| clients | quotes | client_id | RESTRICT |
| clients | messages | client_id | CASCADE |
| clients | calendar_events | client_id | SET NULL |
| tasks | interventions | task_id | CASCADE |
| tasks | task_history | task_id | CASCADE |
| tasks | quotes | task_id | SET NULL |
| tasks | calendar_events | task_id | CASCADE |
| tasks | messages | task_id | CASCADE |
| interventions | intervention_steps | intervention_id | CASCADE |
| interventions | photos | intervention_id | CASCADE |
| interventions | material_consumption | intervention_id | CASCADE |
| interventions | inventory_transactions | intervention_id | SET NULL |
| interventions | intervention_reports | intervention_id | CASCADE |
| intervention_steps | photos | step_id | SET NULL |
| intervention_steps | material_consumption | step_id | SET NULL |
| intervention_steps | inventory_transactions | step_id | SET NULL |
| materials | quote_items | material_id | SET NULL |
| materials | material_consumption | material_id | RESTRICT |
| materials | inventory_transactions | material_id | RESTRICT |
| material_categories | material_categories | parent_id | CASCADE |
| material_categories | materials | category_id | SET NULL |
| suppliers | materials | supplier_id | SET NULL |
| quotes | quote_items | quote_id | CASCADE |
| quotes | quote_attachments | quote_id | CASCADE |
| message_templates | messages | template_id | SET NULL |
| calendar_events | calendar_events | parent_event_id | CASCADE |

---

## Migration Files (58 files)

| Number | File | Description |
|--------|------|-------------|
| 002 | rename_ppf_zone.sql | Rename PPF zone column |
| 003 | add_client_stats_triggers.sql | Client statistics triggers |
| 004 | add_task_client_index.sql | Task-client index |
| 005 | add_task_indexes.sql | Task indexes |
| 006 | add_step_location_columns.sql | GPS columns for steps |
| 007 | add_user_consent.sql | GDPR consent table |
| 008 | add_workflow_constraints.sql | Workflow FK constraints |
| 009 | add_task_number_to_interventions.sql | Task number denormalization |
| 010 | fix_task_statuses.sql | Task status fixes |
| 011 | prevent_duplicate_interventions.sql | Unique constraint |
| 012 | add_material_tables.sql | Materials, categories, suppliers |
| 013 | add_suppliers_table.sql | Supplier details |
| 014 | add_avatar_url.sql | Avatar URL to user_settings |
| 015 | add_two_factor_auth.sql | 2FA columns |
| 016 | add_task_assignment_indexes.sql | Assignment indexes |
| 017 | add_cache_metadata.sql | Cache tables |
| 018 | add_settings_audit_log.sql | Settings audit |
| 019 | enhanced_performance_indexes.sql | Performance indexes |
| 020 | fix_cache_metadata_schema.sql | Schema fix |
| 021 | add_client_statistics_view.sql | Statistics view |
| 022 | add_task_history_table.sql | Task history |
| 023 | add_messaging_tables.sql | Messages, templates |
| 024 | add_inventory_management.sql | Inventory transactions |
| 025 | add_analytics_dashboard.sql | Audit events |
| 026 | fix_user_settings.sql | Settings fix |
| 027 | add_task_constraints.sql | Task constraints |
| 028 | add_two_factor_user_columns.sql | 2FA columns |
| 031 | add_inventory_non_negative_checks.sql | Stock CHECKs |
| 032 | add_intervention_task_fk.sql | Intervention FK |
| 033 | add_task_workflow_fks.sql | Workflow FKs |
| 034 | add_session_activity_index.sql | Session index |
| 035 | add_tasks_deleted_at_index.sql | Soft delete index |
| 036 | core_screen_indexes.sql | Screen indexes |
| 037 | quotes.sql | Quotes tables |
| 038 | inventory_transaction_lookup_index.sql | Transaction index |
| 039 | add_fk_indexes.sql | FK indexes |
| 040 | add_activity_and_reference_indexes.sql | Activity indexes |
| 041 | replace_user_sessions_with_sessions.sql | Sessions table |
| 042 | fix_client_statistics_view.sql | View fix |
| 043 | add_parent_id_index.sql | Parent index |
| 044 | add_notifications_table.sql | Notifications |
| 045 | add_user_settings_insert_trigger.sql | Settings trigger |
| 046 | drop_user_settings_insert_trigger.sql | Drop trigger |
| 047 | add_quotes_missing_columns.sql | Quote columns |
| 048 | fix_quotes_status_constraint.sql | Status fix |
| 049 | remove_quote_sharing.sql | Remove sharing |
| 050 | add_materials_soft_delete_columns.sql | Materials soft delete |
| 051 | quotes_soft_delete.sql | Quotes soft delete |
| 052 | add_intervention_reports_table.sql | Reports table |
| 053 | soft_delete_indexes.sql | Soft delete indexes |
| 054 | app_settings_table.sql | App settings |
| 055 | organizations_table.sql | Organizations |
| 056 | organization_settings_table.sql | Org settings |
| 057 | add_login_attempts_table.sql | Login attempts |
| 058 | add_deleted_by_columns.sql | Deleted_by FKs |

---

## CHECK Constraints Summary

### Enums

```sql
-- User roles
role CHECK (role IN ('admin', 'supervisor', 'technician', 'viewer'))

-- Customer types
customer_type CHECK (customer_type IN ('individual', 'business'))

-- Task status
status CHECK (status IN ('draft', 'scheduled', 'in_progress', 'completed', 'cancelled', 'on_hold', 'pending', 'invalid', 'archived', 'failed', 'overdue', 'assigned', 'paused'))

-- Task priority
priority CHECK (priority IN ('low', 'medium', 'high', 'urgent'))

-- Intervention status
status CHECK (status IN ('pending', 'in_progress', 'paused', 'completed', 'cancelled'))

-- Intervention step type
step_type CHECK (step_type IN ('inspection', 'preparation', 'installation', 'finalization'))

-- Intervention step status
step_status CHECK (step_status IN ('pending', 'in_progress', 'paused', 'completed', 'failed', 'skipped', 'rework'))

-- Material type
material_type CHECK (material_type IN ('ppf_film', 'adhesive', 'cleaning_solution', 'tool', 'consumable'))

-- Unit of measure
unit_of_measure CHECK (unit_of_measure IN ('piece', 'meter', 'liter', 'gram', 'roll'))

-- Quote status
status CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired', 'changes_requested'))

-- Quote item kind
kind CHECK (kind IN ('labor', 'material', 'service', 'discount'))

-- Transaction type
transaction_type CHECK (transaction_type IN ('stock_in', 'stock_out', 'adjustment', 'transfer', 'waste', 'return'))

-- Message type
message_type CHECK (message_type IN ('email', 'sms', 'in_app'))

-- Message status
status CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'read'))

-- Message priority
priority CHECK (priority IN ('low', 'normal', 'high', 'urgent'))

-- Weather condition
weather_condition CHECK (weather_condition IN ('sunny', 'cloudy', 'rainy', 'foggy', 'windy', 'other'))

-- Lighting condition
lighting_condition CHECK (lighting_condition IN ('natural', 'artificial', 'mixed'))

-- Work location
work_location CHECK (work_location IN ('indoor', 'outdoor', 'semi_covered'))

-- Film type
film_type CHECK (film_type IN ('standard', 'premium', 'matte', 'colored'))

-- Photo type
photo_type CHECK (photo_type IN ('before', 'during', 'after'))

-- Mime type
mime_type CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/heic', 'image/webp'))

-- Attachment type
attachment_type CHECK (attachment_type IN ('image', 'document', 'other'))
```

### Numeric Ranges

```sql
-- Vehicle year
vehicle_year CHECK (vehicle_year BETWEEN 1900 AND 2100)

-- Completion percentage
completion_percentage CHECK (completion_percentage BETWEEN 0 AND 100)

-- Humidity percentage
humidity_percentage CHECK (humidity_percentage BETWEEN 0 AND 100)

-- GPS latitude
latitude CHECK (latitude BETWEEN -90 AND 90)

-- GPS longitude
longitude CHECK (longitude BETWEEN -180 AND 180)

-- Quality scores
quality_score CHECK (quality_score BETWEEN 0 AND 100)
validation_score CHECK (validation_score BETWEEN 0 AND 100)
blur_score CHECK (blur_score BETWEEN 0 AND 100)
exposure_score CHECK (exposure_score BETWEEN 0 AND 100)
composition_score CHECK (composition_score BETWEEN 0 AND 100)

-- Customer satisfaction
customer_satisfaction CHECK (customer_satisfaction BETWEEN 1 AND 10)

-- Stock quantities
current_stock CHECK (current_stock >= 0)
minimum_stock CHECK (minimum_stock >= 0)
quantity_used CHECK (quantity_used >= 0)

-- Supplier ratings
quality_rating CHECK (quality_rating BETWEEN 0.0 AND 5.0)
delivery_rating CHECK (delivery_rating BETWEEN 0.0 AND 5.0)
on_time_delivery_rate CHECK (on_time_delivery_rate BETWEEN 0.0 AND 100.0)

-- Organization constraint (single row)
id CHECK (id = 'default')
```

---

## Recommendations

1. **Composite Indexes**: Consider adding composite indexes for common query patterns:
   - `(status, scheduled_date)` on tasks
   - `(technician_id, status)` on tasks
   - `(client_id, status)` on tasks

2. **Soft Delete Consistency**: Most tables have `deleted_at` but some may be missing `deleted_by` - verify consistency.

3. **Denormalization**: Some tables have denormalized data (`client_name` in interventions) - ensure triggers or application code keeps these in sync.

4. **FTS Optimization**: The `clients_fts` table should be kept in sync via triggers.

5. **Timestamp Convention**: All timestamps are milliseconds (ms) since Unix epoch, stored as INTEGER.