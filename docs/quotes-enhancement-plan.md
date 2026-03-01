# Quotes Feature Enhancement Plan

> Inspired by `docs/source-repo/quotes` implementation
> ADR-Compliant Adaptation for RPMA v2

## Status

**Status**: Planning
**Created**: 2026-03-01
**Decision**: Pending Approval

---

## Executive Summary

This document outlines a comprehensive plan to enhance RPMA's quotes feature based on an external reference implementation (`docs/source-repo/quotes`). The adaptation prioritizes ADR compliance, offline-first architecture, and incremental implementation.

### Key Enhancements

1. **Quote-Level Discounts** - Percentage and fixed-amount discounts
2. **Attachments Management** - Image and document attachments per quote
3. **Enhanced Statuses** - Additional quote states for better workflow
4. **Domain Events Integration** - Quote acceptance triggers service creation
5. **Improved PDF Export** - Professional invoice-like layout
6. **Local-First Sharing** - Export-based sharing (offline compliant)

### Scope Exclusions (Cloud-Dependent)

- ❌ Public web links (requires cloud hosting)
- ❌ Customer response portal (requires online access)
- ❌ Email/SMS integration (requires external services)
- ❌ Real-time collaboration (requires network)

---

## ADR Compliance Analysis

### ✅ Fully Compliant

| ADR | Compliance | Notes |
|-----|-----------|-------|
| **ADR-001: Module Boundaries** | ✅ Compliant | All work within `quotes/` bounded context |
| **ADR-002: Transaction Boundaries** | ✅ Compliant | Transactions in application layer |
| **ADR-003: Error Contract** | ✅ Compliant | Using `ApiResponse<T>` pattern |
| **ADR-005: IPC Mapping** | ✅ Compliant | Thin IPC handlers, no business logic |
| **ADR-006: RBAC Policy** | ✅ Compliant | Session token validation with role checks |
| **ADR-007: Logging Correlation** | ✅ Compliant | Correlation ID propagation |
| **ADR-008: Offline-First** | ✅ Compliant | Local SQLite, file storage, no external deps |

### ⚠️ Key Architectural Decisions

#### Decision 1: Quote-to-Service Conversion via Events (ADR-004)

**Approach**:
- Quotes domain emits `QuoteAccepted` event
- Interventions/tasks domain listens and creates service record
- Configurable: auto-convert or manual conversion

**Rationale**:
- Maintains domain decoupling (ADR-001)
- Avoids direct domain dependencies (ADR-004)
- Allows flexible conversion policies
- Testable in isolation

#### Decision 2: Offline-First Sharing Strategy (ADR-008)

**Approach**:
- Export quotes as PDF/JSON for sharing
- No public URLs or customer portals
- OS-level email/print integration only
- Attachments stored locally in `app_data/quotes/`

**Rationale**:
- Maintains offline functionality (ADR-008)
- Avoids cloud infrastructure
- Simpler architecture
- User-controlled sharing

#### Decision 3: Discount Implementation

**Approach**:
- Quote-level discount fields (not discount items)
- Types: `percentage`, `fixed`, `none`
- Calculated at application layer

**Rationale**:
- Simpler data model
- Matches source-repo reference
- Easier to calculate totals
- Better UX for applying discounts

---

## Phase 1: Data Model Enhancements

### 1.1 Extend Quote Model

**File**: `src-tauri/src/domains/quotes/domain/models/quote.rs`

```rust
// Add to QuoteStatus enum
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, TS)]
pub enum QuoteStatus {
    #[serde(rename = "draft")]
    #[default]
    Draft,
    #[serde(rename = "sent")]
    Sent,
    #[serde(rename = "accepted")]
    Accepted,
    #[serde(rename = "rejected")]
    Rejected,
    #[serde(rename = "expired")]
    Expired,
    #[serde(rename = "converted")]
    Converted,
    #[serde(rename = "changes_requested")]
    ChangesRequested,
}

// Add to Quote struct
pub discount_type: Option<String>,        // "percentage" | "fixed" | null
pub discount_value: Option<i64>,          // Discount amount or percentage
pub discount_amount: Option<i64>,          // Calculated discount in cents
```

**Validation Rules**:
- `discount_value` is cents for "fixed", percentage for "percentage" type
- `discount_amount` is calculated, never set directly
- Discounts apply to `subtotal`, then tax is calculated on discounted amount

### 1.2 Database Migration

**File**: Create new migration `migrations/XXXX_quote_enhancements.sql`

```sql
-- Add discount fields
ALTER TABLE quotes ADD COLUMN discount_type TEXT
  CHECK (discount_type IN ('percentage', 'fixed'));
ALTER TABLE quotes ADD COLUMN discount_value INTEGER DEFAULT 0;
ALTER TABLE quotes ADD COLUMN discount_amount INTEGER DEFAULT 0;

-- Create indexes
CREATE INDEX idx_quotes_discount_type ON quotes(discount_type);
```

### 1.3 Create QuoteAttachment Model

**File**: Create `src-tauri/src/domains/quotes/domain/models/quote_attachment.rs`

```rust
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub enum QuoteAttachmentCategory {
    #[serde(rename = "image")]
    Image,
    #[serde(rename = "document")]
    Document,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct QuoteAttachment {
    pub id: String,
    pub quote_id: String,
    pub file_name: String,
    pub file_path: String,
    pub file_type: String,
    pub file_size: i64,
    pub category: QuoteAttachmentCategory,
    pub description: Option<String>,
    pub include_in_invoice: bool,
    pub created_at: i64,
}

// Request DTOs
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct CreateQuoteAttachmentRequest {
    pub quote_id: String,
    pub file_name: String,
    pub file_path: String,
    pub file_type: String,
    pub file_size: i64,
    pub category: QuoteAttachmentCategory,
    pub description: Option<String>,
    pub include_in_invoice: bool,
}
```

**Migration for attachments**:
```sql
CREATE TABLE quote_attachments (
    id TEXT PRIMARY KEY,
    quote_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('image', 'document')),
    description TEXT,
    include_in_invoice INTEGER DEFAULT 1,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
);

CREATE INDEX idx_quote_attachments_quote_id ON quote_attachments(quote_id);
CREATE INDEX idx_quote_attachments_category ON quote_attachments(category);
```

### 1.4 Domain Events for Quotes

**File**: `src-tauri/src/shared/event_bus/events.rs`

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuoteAccepted {
    pub quote_id: String,
    pub client_id: String,
    pub total_amount: i64,
    pub vehicle_plate: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuoteRejected {
    pub quote_id: String,
    pub client_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuoteConverted {
    pub quote_id: String,
    pub service_record_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuoteItemsChanged {
    pub quote_id: String,
    pub subtotal: i64,
    pub tax_total: i64,
    pub total: i64,
}
```

---

## Phase 2: Backend Business Logic

### 2.1 Repository Enhancements

**File**: `src-tauri/src/domains/quotes/infrastructure/quote_repository.rs`

**Add methods**:

```rust
impl QuoteRepository {
    /// Update quote discount fields
    pub fn update_discount(
        &self,
        id: &str,
        discount_type: Option<String>,
        discount_value: Option<i64>,
        discount_amount: i64,
    ) -> RepoResult<()> { /* ... */ }

    /// Quote attachments
    pub fn create_attachment(
        &self,
        attachment: &QuoteAttachment,
    ) -> RepoResult<()> { /* ... */ }

    pub fn find_attachments_by_quote_id(
        &self,
        quote_id: &str,
    ) -> RepoResult<Vec<QuoteAttachment>> { /* ... */ }

    pub fn delete_attachment(
        &self,
        id: &str,
        quote_id: &str,
    ) -> RepoResult<()> { /* ... */ }
}
```

### 2.2 Application Service

**File**: Create/Update `src-tauri/src/domains/quotes/application/quote_service.rs`

```rust
pub struct QuoteService {
    repo: Arc<QuoteRepository>,
    db: Arc<Database>,
    event_bus: Arc<EventBus>,
}

impl QuoteService {
    /// Calculate quote totals with discount
    pub fn calculate_totals(
        &self,
        items: &[QuoteItem],
        discount_type: Option<&str>,
        discount_value: Option<i64>,
    ) -> (i64, i64, i64) {
        // (subtotal, discount_amount, tax_amount, total)
    }

    /// Mark quote as accepted and emit event
    pub async fn mark_accepted(&self, quote_id: &str) -> Result<Quote> {
        // Update status
        // Emit QuoteAccepted event
    }

    /// Mark quote as rejected and emit event
    pub async fn mark_rejected(&self, quote_id: &str) -> Result<Quote> {
        // Update status
        // Emit QuoteRejected event
    }

    /// Add attachment to quote
    pub async fn add_attachment(
        &self,
        quote_id: &str,
        attachment: CreateQuoteAttachmentRequest,
    ) -> Result<QuoteAttachment> {
        // Validate quote exists
        // Store file in app_data/quotes/
        // Create attachment record
        // Emit QuoteItemsChanged event
    }

    /// Remove attachment
    pub async fn delete_attachment(
        &self,
        quote_id: &str,
        attachment_id: &str,
    ) -> Result<()> {
        // Delete from DB
        // Delete from filesystem
        // Invalidate cache
    }
}
```

### 2.3 Event Handlers

**File**: Create `src-tauri/src/domains/interventions/application/handlers/quote_handlers.rs`

```rust
pub struct QuoteAcceptedHandler {
    service_record_service: Arc<ServiceRecordService>,
}

#[async_trait::async_trait]
impl EventHandler<QuoteAccepted> for QuoteAcceptedHandler {
    async fn handle(&self, event: QuoteAccepted) -> Result<()> {
        // Check if auto-convert is enabled (setting)
        // Create service record from quote data
        // Emit QuoteConverted event
    }
}
```

**Registration**:
```rust
// In src-tauri/src/service_builder.rs
event_bus.register_handler(
    "quote_accepted",
    Box::new(QuoteAcceptedHandler::new(service_record_service))
)?;
```

### 2.4 IPC Commands

**File**: `src-tauri/src/domains/quotes/ipc/quote.rs`

**Add commands**:

```rust
#[tauri::command]
#[instrument(skip(state, request))]
pub async fn quote_update_discount(
    request: QuoteUpdateDiscountRequest,
    state: AppState<'_>,
) -> Result<ApiResponse<Quote>, AppError> {
    let current_user = authenticate!(request, state);
    check_quote_permission(&current_user.role, "update")?;

    let quote = state.quote_service
        .update_discount(request.quote_id, request.discount_type, request.discount_value)
        .await?;

    Ok(ApiResponse::success(quote))
}

#[tauri::command]
#[instrument(skip(state, request))]
pub async fn quote_add_attachment(
    request: QuoteAddAttachmentRequest,
    state: AppState<'_>,
) -> Result<ApiResponse<QuoteAttachment>, AppError> {
    let current_user = authenticate!(request, state);
    check_quote_permission(&current_user.role, "update")?;

    let attachment = state.quote_service
        .add_attachment(request.quote_id, request.attachment)
        .await?;

    Ok(ApiResponse::success(attachment))
}

#[tauri::command]
#[instrument(skip(state, request))]
pub async fn quote_delete_attachment(
    request: QuoteDeleteAttachmentRequest,
    state: AppState<'_>,
) -> Result<ApiResponse<bool>, AppError> {
    let current_user = authenticate!(request, state);
    check_quote_permission(&current_user.role, "delete")?;

    let deleted = state.quote_service
        .delete_attachment(request.quote_id, request.attachment_id)
        .await?;

    Ok(ApiResponse::success(deleted))
}
```

---

## Phase 3: Frontend Domain Layer

### 3.1 Update Types

**File**: `frontend/src/domains/quotes/api/types.ts`

```typescript
export interface Quote {
  // ... existing fields
  discountType?: 'percentage' | 'fixed' | null;
  discountValue?: number;  // cents or percentage
  discountAmount?: number;  // calculated in cents
  attachments?: QuoteAttachment[];
}

export interface QuoteAttachment {
  id: string;
  quoteId: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  category: 'image' | 'document';
  description?: string | null;
  includeInInvoice: boolean;
  createdAt: string;
}

export interface UpdateQuoteDiscountRequest {
  discountType?: 'percentage' | 'fixed' | null;
  discountValue?: number;
}
```

### 3.2 IPC Wrappers

**File**: `frontend/src/domains/quotes/ipc/quotes.ipc.ts`

```typescript
export async function updateQuoteDiscount(
  quoteId: string,
  request: UpdateQuoteDiscountRequest
): Promise<Quote>

export async function addQuoteAttachment(
  quoteId: string,
  attachment: CreateQuoteAttachmentRequest
): Promise<QuoteAttachment>

export async function deleteQuoteAttachment(
  quoteId: string,
  attachmentId: string
): Promise<void>

export async function listQuoteAttachments(
  quoteId: string
): Promise<QuoteAttachment[]>
```

### 3.3 Custom Hooks

**File**: Create `frontend/src/domains/quotes/hooks/useQuoteDiscount.ts`

```typescript
export function useQuoteDiscount(quoteId: string) {
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | null>(null);
  const [discountValue, setDiscountValue] = useState(0);
  const [loading, setLoading] = useState(false);

  const updateDiscount = async (type: string, value: number) => {
    setLoading(true);
    try {
      await updateQuoteDiscount(quoteId, { discountType: type, discountValue: value });
    } finally {
      setLoading(false);
    }
  };

  return { discountType, discountValue, setDiscountType, setDiscountValue, updateDiscount, loading };
}
```

**File**: Create `frontend/src/domains/quotes/hooks/useQuoteAttachments.ts`

```typescript
export function useQuoteAttachments(quoteId: string) {
  const [attachments, setAttachments] = useState<QuoteAttachment[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listQuoteAttachments(quoteId);
      setAttachments(data);
    } finally {
      setLoading(false);
    }
  }, [quoteId]);

  const addAttachment = async (attachment: CreateQuoteAttachmentRequest) => {
    const result = await addQuoteAttachment(quoteId, attachment);
    setAttachments(prev => [...prev, result]);
  };

  const deleteAttachment = async (attachmentId: string) => {
    await deleteQuoteAttachment(quoteId, attachmentId);
    setAttachments(prev => prev.filter(a => a.id !== attachmentId));
  };

  useEffect(() => { refresh(); }, [refresh]);

  return { attachments, loading, addAttachment, deleteAttachment, refresh };
}
```

---

## Phase 4: Frontend UI Components

### 4.1 Enhanced Quote Form

**File**: Create `frontend/src/domains/quotes/components/QuoteDiscountSection.tsx`

```typescript
export function QuoteDiscountSection({
  discountType,
  discountValue,
  onChangeType,
  onChangeValue,
  discountAmount,
  currencyCode = 'USD',
}: QuoteDiscountSectionProps) {
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Discount</h3>
        <Select value={discountType || 'none'} onValueChange={onChangeType}>
          <SelectTrigger className="h-7 w-28 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="percentage">Percentage</SelectItem>
            <SelectItem value="fixed">Fixed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {discountType && discountType !== 'none' && (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="0"
            step={discountType === 'percentage' ? '0.1' : '0.01'}
            value={discountValue}
            onChange={(e) => onChangeValue(parseFloat(e.target.value) || 0)}
            className="h-7 w-20 text-right text-xs"
          />
          <span className="text-xs text-muted-foreground">
            {discountType === 'percentage' ? '%' : currencyCode}
          </span>
          {discountAmount > 0 && (
            <span className="text-xs text-destructive">
              -{formatCurrency(discountAmount, currencyCode)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
```

### 4.2 Attachments Manager

**File**: Create `frontend/src/domains/quotes/components/QuoteAttachmentsManager.tsx`

```typescript
export function QuoteAttachmentsManager({
  quoteId,
  initialAttachments,
}: QuoteAttachmentsManagerProps) {
  const { attachments, addAttachment, deleteAttachment } = useQuoteAttachments(quoteId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Determine category
    const category = file.type.startsWith('image/') ? 'image' : 'document';

    const request: CreateQuoteAttachmentRequest = {
      quoteId,
      fileName: file.name,
      filePath: file.name, // Will be set by backend
      fileType: file.type,
      fileSize: file.size,
      category,
      includeInInvoice: true,
    };

    await addAttachment(request);
  };

  const images = attachments.filter(a => a.category === 'image');
  const documents = attachments.filter(a => a.category === 'document');

  return (
    <div className="space-y-6">
      {/* Images */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Images</h3>
        {images.length === 0 ? (
          <p className="text-sm text-muted-foreground">No images</p>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {images.map(img => (
              <div key={img.id} className="relative group">
                <img
                  src={`file://${img.filePath}`}
                  alt={img.fileName}
                  className="w-full h-24 object-cover rounded border"
                />
                <button
                  onClick={() => deleteAttachment(img.id)}
                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          <Plus className="mr-1 h-3 w-3" /> Add Image
        </Button>
      </div>

      {/* Documents */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Documents</h3>
        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No documents</p>
        ) : (
          <ul className="space-y-2">
            {documents.map(doc => (
              <li key={doc.id} className="flex items-center justify-between text-sm">
                <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{doc.fileName}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteAttachment(doc.id)}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx"
      />
    </div>
  );
}
```

### 4.3 Enhanced Quote Totals Component

**File**: Update `frontend/src/domains/quotes/components/QuoteTotals.tsx`

```typescript
export function QuoteTotals({
  subtotal,
  taxRate,
  discountType,
  discountValue,
  currencyCode = 'USD',
}: QuoteTotalsProps) {
  // Calculate discount
  const discountAmount = discountType === 'percentage'
    ? Math.round(subtotal * (discountValue / 100))
    : Math.min(discountValue, subtotal);

  const subtotalAfterDiscount = subtotal - discountAmount;
  const taxAmount = Math.round(subtotalAfterDiscount * (taxRate / 100));
  const total = subtotalAfterDiscount + taxAmount;

  return (
    <div className="rounded-lg border p-4 space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Subtotal</span>
        <span>{formatCurrency(subtotal, currencyCode)}</span>
      </div>

      {discountAmount > 0 && (
        <div className="flex justify-between text-sm text-destructive">
          <span>Discount ({discountType === 'percentage' ? `${discountValue}%` : ''})</span>
          <span>-{formatCurrency(discountAmount, currencyCode)}</span>
        </div>
      )}

      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Tax ({taxRate}%)</span>
        <span>{formatCurrency(taxAmount, currencyCode)}</span>
      </div>

      <div className="flex justify-between text-lg font-bold border-t pt-2">
        <span>Total</span>
        <span>{formatCurrency(total, currencyCode)}</span>
      </div>
    </div>
  );
}
```

---

## Phase 5: Integration & Testing

### 5.1 Integration Points

**Service Builder Registration**:
```rust
// src-tauri/src/service_builder.rs

// Register event handlers
event_bus.register_handler(
    "quote_accepted",
    Box::new(interventions::QuoteAcceptedHandler::new(service_record_service))
)?;

// Register IPC commands
tauri::Builder::default()
    .manage(state)
    .invoke_handler(tauri::generate_handler![
        // Existing commands...
        quote_update_discount,
        quote_add_attachment,
        quote_delete_attachment,
    ])
```

**Frontend Routing**:
```typescript
// frontend/src/app/quotes/[id]/page.tsx

import { QuoteDiscountSection } from '@/domains/quotes/components/QuoteDiscountSection';
import { QuoteAttachmentsManager } from '@/domains/quotes/components/QuoteAttachmentsManager';
```

### 5.2 Testing Strategy

**Unit Tests**:
```rust
#[cfg(test)]
mod tests {
    #[test]
    fn test_discount_calculation_percentage() {
        let subtotal = 10000; // $100.00
        let discount_type = Some("percentage");
        let discount_value = 10; // 10%

        let (subtotal, discount_amount, tax_amount, total) =
            calculate_totals(&[], discount_type, Some(discount_value), 20);

        assert_eq!(subtotal, 10000);
        assert_eq!(discount_amount, 1000); // $10.00
        assert_eq!(tax_amount, 1800); // 20% on $90
        assert_eq!(total, 10800); // $108.00
    }

    #[test]
    fn test_discount_calculation_fixed() {
        let subtotal = 10000; // $100.00
        let discount_type = Some("fixed");
        let discount_value = 500; // $5.00

        let (subtotal, discount_amount, tax_amount, total) =
            calculate_totals(&[], discount_type, Some(discount_value), 20);

        assert_eq!(discount_amount, 500); // $5.00
        assert_eq!(tax_amount, 1900); // 20% on $95
        assert_eq!(total, 11400); // $114.00
    }
}
```

**Integration Tests**:
```rust
#[tokio::test]
async fn test_quote_accepted_creates_service_record() {
    let (state, _) = setup_test_app().await;

    // Create quote
    let quote = create_test_quote(&state).await;

    // Mark as accepted
    let result = state.quote_service.mark_accepted(&quote.id).await.unwrap();
    assert_eq!(result.status, QuoteStatus::Accepted);

    // Check service record was created
    let service_records = state.service_record_service
        .list_by_quote_id(&quote.id)
        .await.unwrap();
    assert_eq!(service_records.len(), 1);
}
```

**E2E Tests (Frontend)**:
```typescript
describe('Quote Discounts', () => {
  it('should apply percentage discount', async () => {
    render(<QuoteDetailPage quote={quote} />);

    const discountType = screen.getByLabelText('Discount Type');
    await userEvent.selectOptions(discountType, 'percentage');

    const discountValue = screen.getByLabelText('Discount Value');
    await userEvent.type(discountValue, '10');

    expect(screen.getByText('Total: $90.00')).toBeInTheDocument();
  });

  it('should apply fixed discount', async () => {
    render(<QuoteDetailPage quote={quote} />);

    const discountType = screen.getByLabelText('Discount Type');
    await userEvent.selectOptions(discountType, 'fixed');

    const discountValue = screen.getByLabelText('Discount Value');
    await userEvent.type(discountValue, '5');

    expect(screen.getByText('Total: $95.00')).toBeInTheDocument();
  });
});
```

---

## Implementation Priority

### Sprint 1: Core Discounts (Week 1-2)
- ✅ Phase 1.1: Extend Quote model
- ✅ Phase 1.2: Database migration
- ✅ Phase 2.1: Repository discount methods
- ✅ Phase 2.2: Application service discount logic
- ✅ Phase 3.1: Frontend types
- ✅ Phase 4.1: Discount UI component
- ✅ Phase 5.2: Discount unit tests

**Success Criteria**:
- Users can apply percentage discounts
- Users can apply fixed amount discounts
- Totals calculate correctly
- Discounts persist and reload

### Sprint 2: Attachments (Week 3-4)
- ✅ Phase 1.3: Create QuoteAttachment model
- ✅ Phase 1.4: Attachments migration
- ✅ Phase 2.1: Attachment repository methods
- ✅ Phase 2.2: Attachment service logic
- ✅ Phase 2.3: Attachment IPC commands
- ✅ Phase 3.2: Attachment IPC wrappers
- ✅ Phase 3.3: Attachment hooks
- ✅ Phase 4.2: Attachments manager UI
- ✅ Phase 5.2: Attachment integration tests

**Success Criteria**:
- Users can upload images
- Users can upload documents
- Attachments display correctly
- Attachments can be deleted
- File validation works

### Sprint 3: Domain Events (Week 5-6)
- ✅ Phase 1.4: Define domain events
- ✅ Phase 2.2: Emit events from quote service
- ✅ Phase 2.3: Create event handlers
- ✅ Phase 2.4: Register handlers
- ✅ Phase 5.2: Event integration tests

**Success Criteria**:
- Quote acceptance emits event
- Service record created from quote
- Conversion works end-to-end
- Event tracing in logs

### Sprint 4: Polish & Testing (Week 7-8)
- ✅ Phase 4.3: Enhanced totals component
- ✅ Phase 5.1: Integration points
- ✅ Phase 5.2: E2E tests
- ✅ Performance optimization
- ✅ Code review and cleanup

**Success Criteria**:
- All tests passing
- Performance benchmarks met
- ADR validation passes
- Code quality standards met

---

## Migration Plan

### Pre-Migration Checklist
- [ ] Backup existing SQLite database
- [ ] Run `npm run types:sync` to verify current types
- [ ] Review existing quote data for compatibility
- [ ] Create feature branch

### Migration Steps
1. **Run Migration**:
   ```bash
   cd src-tauri
   cargo run -- migrate
   ```

2. **Verify Migration**:
   ```bash
   sqlite3 data/rpma.db "PRAGMA table_info(quotes);"
   ```

3. **Regenerate Types**:
   ```bash
   npm run types:sync
   ```

4. **Run Tests**:
   ```bash
   cd src-tauri && cargo test --lib
   cd frontend && npm test
   ```

5. **Validate Architecture**:
   ```bash
   npm run validate:bounded-contexts
   npm run architecture:check
   ```

### Rollback Plan
If migration fails:
1. Restore from database backup
2. Revert migration SQL
3. Rollback code changes
4. Document failure for review

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|---------|------------|
| **Data corruption from migration** | Low | High | Backup before migration, test on staging |
| **Performance degradation** | Medium | Medium | Benchmark attachment queries, add indexes |
| **Event handler failures** | Low | Medium | Error handling, event replay capability |
| **Attachment storage overflow** | Medium | Low | File size limits, storage quota |
| **Frontend type mismatches** | Low | Low | Strict TypeScript, CI checks |
| **Domain coupling violations** | Low | High | Architecture checks, code review |

---

## Success Metrics

### Functional Metrics
- ✅ Discount calculations accurate (100% test coverage)
- ✅ Attachments upload/download reliably (99.9% success rate)
- ✅ Quote-to-service conversion (98% success rate)
- ✅ UI responsiveness (< 100ms interaction delay)

### Quality Metrics
- ✅ Zero ADR violations
- ✅ 90%+ code coverage on new code
- ✅ All tests passing
- ✅ No performance regressions

### User Experience Metrics
- ✅ Time to create quote with discount < 2 minutes
- ✅ Time to attach image < 5 seconds
- ✅ Error messages clear and actionable
- ✅ Offline functionality verified

---

## Open Questions

1. **Quote Numbering**: Should we keep `DEV-XXXXX` format or switch to `QT-XXXXX` (matching source-repo)?

2. **Auto-Conversion**: Should quote acceptance automatically create service record, or require manual user action?

3. **Attachment Limits**: Should we enforce limits on attachments (e.g., max 10 images, max 5 documents per quote)?

4. **File Storage**: Should we copy uploaded files to `app_data/quotes/` or store references to original locations?

5. **Discount on Tax**: Should discount apply before or after tax calculation? (Current plan: before tax)

6. **Rich Text Editor**: Should we add a rich text editor for quote notes/description, or keep plain text?

7. **Implementation Order**: Should we implement all phases sequentially as prioritized, or tackle in parallel?

---

## References

- **Source Reference**: `docs/source-repo/quotes/`
- **ADR-001: Module Boundaries**: `docs/adr/001-module-boundaries.md`
- **ADR-002: Transaction Boundaries**: `docs/adr/002-transaction-boundaries.md`
- **ADR-003: Error Contract**: `docs/adr/003-error-contract.md`
- **ADR-004: Domain Events**: `docs/adr/004-domain-events.md`
- **ADR-005: IPC Mapping**: `docs/adr/005-ipc-mapping.md`
- **ADR-006: RBAC Policy**: `docs/adr/006-rbac-policy.md`
- **ADR-007: Logging Correlation**: `docs/adr/007-logging-correlation.md`
- **ADR-008: Offline-First Strategy**: `docs/adr/008-offline-first.md`

---

## Appendix

### Discount Calculation Examples

**Example 1: 10% Discount**
```
Subtotal: $100.00
Discount: 10% = $10.00
After Discount: $90.00
Tax (20%): $18.00
Total: $108.00
```

**Example 2: $5 Fixed Discount**
```
Subtotal: $100.00
Discount: $5.00
After Discount: $95.00
Tax (20%): $19.00
Total: $114.00
```

### Event Flow Diagram

```
┌─────────────┐
│  Frontend  │
└──────┬──────┘
       │ quote_mark_accepted(quote_id)
       ▼
┌──────────────┐
│ IPC Handler  │
└──────┬───────┘
       │ authenticate
       │ delegate to service
       ▼
┌───────────────┐
│ Quote Service  │
└──────┬────────┘
       │ update status to 'accepted'
       │ emit QuoteAccepted event
       ▼
┌──────────────┐
│  Event Bus   │
└──────┬───────┘
       │ dispatch to handlers
       ▼
┌───────────────────────┐
│ QuoteAcceptedHandler   │
└──────┬────────────────┘
       │ create ServiceRecord
       │ emit QuoteConverted event
       ▼
┌────────────────┐
│ Service DB    │
└───────────────┘
```

---

**Document Version**: 1.0
**Last Updated**: 2026-03-01
**Status**: Pending Review and Approval
