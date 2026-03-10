﻿

## Final Implementation Plan: Multi-Tenant Business Account

### Overview

- **Minimal changes** - Add organization configuration layer
- **No data model changes** - No org_id on task/client/intervention tables
- **4 roles unchanged** - Admin, Supervisor, Technician, Viewer
- **Smart onboarding** - Detect existing data, guide migration or fresh setup

---

### Phase 1: Database Schema

**Migration 055** - Create `organizations` table:
```sql
CREATE TABLE organizations (
  id TEXT PRIMARY KEY DEFAULT 'default',
  
  -- Identity
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  
  -- Business
  legal_name TEXT,
  tax_id TEXT,
  siret TEXT,              -- French business ID
  registration_number TEXT,
  
  -- Contact
  email TEXT,
  phone TEXT,
  website TEXT,
  
  -- Address
  address_street TEXT,
  address_city TEXT,
  address_state TEXT,
  address_zip TEXT,
  address_country TEXT DEFAULT 'France',
  
  -- Branding
  logo_url TEXT,
  logo_data TEXT,          -- Base64 for offline
  primary_color TEXT DEFAULT '#3B82F6',
  secondary_color TEXT DEFAULT '#1E40AF',
  accent_color TEXT,
  
  -- Settings JSON blobs
  business_settings TEXT,  -- hours, holidays, defaults
  invoice_settings TEXT,   -- payment terms, numbering
  
  -- Metadata
  industry TEXT,
  company_size TEXT,
  
  -- Audit
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  
  -- Enforce single org
  CHECK (id = 'default')
);

-- Single-row constraint
CREATE UNIQUE INDEX idx_organizations_single ON organizations(id) WHERE id = 'default';
```

**Migration 056** - Create `organization_settings` table (key-value for flexibility):
```sql
CREATE TABLE organization_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE INDEX idx_org_settings_category ON organization_settings(category);

-- Seed default settings
INSERT INTO organization_settings (key, value, category) VALUES
  ('onboarding_completed', 'false', 'system'),
  ('default_task_priority', 'medium', 'tasks'),
  ('default_session_timeout', '480', 'security'),
  ('require_2fa', 'false', 'security'),
  ('date_format', 'DD/MM/YYYY', 'regional'),
  ('currency', 'EUR', 'regional');
```

---

### Phase 2: Backend Domain

**New files to create**:

```
src-tauri/src/
├── domains/organizations/
│   ├── mod.rs
│   ├── domain/
│   │   ├── mod.rs
│   │   ├── models/
│   │   │   ├── mod.rs
│   │   │   ├── organization.rs      # Organization struct
│   │   │   └── settings.rs          # OrgSettings struct
│   │   └── policy.rs                # Org access policy
│   ├── application/
│   │   ├── mod.rs
│   │   └── organization_service.rs  # CRUD, onboarding logic
│   ├── infrastructure/
│   │   ├── mod.rs
│   │   └── organization_repository.rs
│   └── ipc/
│       ├── mod.rs
│       └── commands.rs              # IPC handlers
├── models/
│   └── organization.rs              # ts-rs exports
```

**IPC Commands**:
```rust
// Public (no auth required for onboarding)
fn get_onboarding_status() -> OnboardingStatus;
fn complete_onboarding(data: OnboardingData) -> Result<Organization>;

// Protected (require session)
fn get_organization() -> Result<Organization>;
fn update_organization(data: UpdateOrganization) -> Result<Organization>;
fn upload_logo(file_path: String) -> Result<String>;
fn get_organization_settings() -> Result<OrgSettings>;
fn update_organization_settings(settings: OrgSettings) -> Result<OrgSettings>;
```

---

### Phase 3: Frontend

**New files**:

```
frontend/src/
├── app/
│   ├── onboarding/
│   │   ├── page.tsx                 # Onboarding wizard
│   │   └── _components/
│   │       ├── OrgSetupStep.tsx
│   │       ├── AdminUserStep.tsx
│   │       └── CompletionStep.tsx
│   └── (authenticated)/settings/
│       └── organization/
│           └── page.tsx             # Org settings page
├── domains/organizations/
│   ├── index.ts                     # Public API
│   ├── api/
│   │   ├── useOrganization.ts
│   │   └── useOnboarding.ts
│   ├── components/
│   │   ├── OrganizationForm.tsx
│   │   ├── BrandingSettings.tsx
│   │   ├── BusinessInfoForm.tsx
│   │   └── LogoUploader.tsx
│   ├── hooks/
│   │   └── useOrganizationSettings.ts
│   └── ipc/
│       └── organization.ipc.ts
```

**Auth Flow Update** (`AuthProvider.tsx`):
```typescript
// Add onboarding check
const { data: onboardingStatus } = await organizationIpc.getOnboardingStatus();
if (!onboardingStatus.completed) {
  router.push('/onboarding');
  return;
}
```

---

### Phase 4: Migration & Seeding Logic

**On first run with existing data**:

1. Check if `organizations` table has the default row
2. If no organization exists:
   - If `app_settings` has company data → auto-migrate
   - If no data → redirect to `/onboarding`
3. Migration script:
```rust
fn migrate_from_app_settings(conn: &Connection) -> Result<()> {
    // Read from app_settings if exists
    let company_name = get_app_setting("company_name");
    let company_email = get_app_setting("company_email");
    // ...
    
    // Create default organization
    conn.execute(
        "INSERT INTO organizations (id, name, email, ...) VALUES ('default', ?, ?, ...)",
        params![company_name, company_email, ...]
    )?;
    
    // Mark onboarding complete
    conn.execute(
        "INSERT INTO organization_settings (key, value) VALUES ('onboarding_completed', 'true')"
    )?;
    
    Ok(())
}
```

---

### Phase 5: UI Updates

**Settings reorganization**:

| Current | New Location |
|---------|--------------|
| Settings > Company Info | Settings > Organization |
| Settings > System (admin) | Settings > Organization |
| Settings > Profile | Settings > Profile (unchanged) |

**Branding integration**:
- App header uses `organization.logo_url`
- Theme colors from `organization.primary_color`
- Reports/invoices use org branding

---

### Files to Modify

**Backend**:
- `src-tauri/src/db/schema.sql` - Add tables
- `src-tauri/src/db/mod.rs` - Add migration logic
- `src-tauri/src/commands/mod.rs` - Register org commands
- `src-tauri/src/models/mod.rs` - Export org models
- `src-tauri/src/domains/auth/` - Add onboarding check

**Frontend**:
- `frontend/src/app/layout.tsx` - Add onboarding redirect
- `frontend/src/domains/auth/api/AuthProvider.tsx` - Onboarding check
- `frontend/src/components/layout/Header.tsx` - Use org logo
- `frontend/src/components/layout/Sidebar.tsx` - Add org settings link
- `frontend/src/types/` - Add generated types after sync

---

### Validation Commands

After implementation:
```bash
# Type sync
npm run types:sync

# Run backend tests
make test

# Architecture check
npm run architecture:check
```

---

## Summary

| Aspect | Approach |
|--------|----------|
| **Database** | Single `organizations` table + `organization_settings` |
| **Data isolation** | Per-DB (existing architecture) |
| **Roles** | Unchanged (4 roles) |
| **Onboarding** | Detect existing data → auto-migrate or wizard |
| **Scope** | Minimal - org config only, no sync prep |

