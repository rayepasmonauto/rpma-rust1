# RPMA Documentation

Auto-generated index of architecture documentation. Run `node scripts/generate-docs-index.js` to update.

## Quick Links

| Document | Summary |
|----------|---------|
| ["Authentication & RBAC"](./authentication-rbac.md) | "Session-based authentication with role-based access control enforced at the IPC layer" |
| ["Backend Architecture"](./backend-architecture.md) | "Rust backend with Domain-Driven Design, four-layer architecture, and 14 bounded contexts" |
| ["Cross-Domain Communication"](./cross-domain-communication.md) | "Event bus and shared contracts for loose coupling between bounded contexts" |
| ["Database & Offline-First"](./database-offline.md) | "SQLite with WAL mode for offline-first operation, connection pooling, and performance optimization" |
| ["Frontend Architecture"](./frontend-architecture.md) | "Next.js 14 frontend with domain mirroring, TanStack Query for backend state, and Zustand for UI state" |
| ["IPC Patterns"](./ipc-patterns.md) | "Type-safe IPC wrapper abstraction for Tauri communication with validation, caching, and error handling" |
| ["Testing Requirements"](./testing-requirements.md) | "Mandatory testing policy with unit, integration, validation, and permission tests" |
| ["Type Generation"](./type-generation.md) | "Automatic TypeScript type generation from Rust via ts-rs" |
| ["Validation Service"](./validation-service.md) | "Centralized validation with domain-specific validators for fields, GPS, business rules, and security" |

## Architecture Decision Records

See [ADR Index](./adr/README.md) for full details.

### Core Architecture

| ADR | Title | Status |
|-----|-------|--------|
| [001](./adr/001-sqlite-offline-first.md) | "SQLite as Local-First Data Store with WAL Mode" | ✅ |
| [002](./adr/002-ddd-four-layer-architecture.md) | "Domain-Driven Design with Four-Layer Architecture" | ✅ |
| [003](./adr/003-typescript-type-generation.md) | "TypeScript Type Generation via ts-rs" | ✅ |
| [004](./adr/004-session-auth-rbac.md) | "Session-Based Authentication with Role-Based Access Control" | ✅ |

### Data & Infrastructure

| ADR | Title | Status |
|-----|-------|--------|
| [006](./adr/006-repository-pattern.md) | "Repository Pattern with Async Traits" | ✅ |
| [007](./adr/007-hybrid-migration-system.md) | "Hybrid SQL + Rust Migration System" | ✅ |
| [008](./adr/008-multi-level-cache.md) | "Multi-Level Cache Architecture" | ✅ |
| [009](./adr/009-compressed-api-responses.md) | "Compressed API Responses for Large Payloads" | ✅ |
| [011](./adr/011-type-safe-ipc-wrappers.md) | "Type-Safe IPC Wrapper Abstraction" | ✅ |
| [017](./adr/017-streaming-queries.md) | "Streaming Queries for Large Result Sets" | ✅ |
| [018](./adr/018-dynamic-pool-sizing.md) | "Dynamic Connection Pool Sizing" | ✅ |

### Frontend & State

| ADR | Title | Status |
|-----|-------|--------|
| [010](./adr/010-frontend-domain-mirroring.md) | "Frontend Domain Mirroring Backend Structure" | ✅ |
| [012](./adr/012-tanstack-query-state.md) | "TanStack Query for Backend State Management" | ✅ |
| [013](./adr/013-zustand-ui-state.md) | "Zustand for Local UI State Management" | ✅ |

### Cross-Cutting Concerns

| ADR | Title | Status |
|-----|-------|--------|
| [005](./adr/005-event-bus-pattern.md) | "In-Memory Event Bus for Cross-Domain Communication" | ✅ |
| [014](./adr/014-request-context-propagation.md) | "Request Context and Correlation ID Propagation" | ✅ |
| [015](./adr/015-validation-service.md) | "Centralized Validation Service with Domain-Specific Validators" | ✅ |
| [016](./adr/016-domain-isolation-contracts.md) | "Domain Isolation via Shared Contracts" | ✅ |

## When to Read What

- **Adding new IPC commands**: "Authentication & RBAC", "Backend Architecture", "IPC Patterns"
- **Implementing permission checks**: "Authentication & RBAC"
- **Understanding role hierarchy**: "Authentication & RBAC"
- **Debugging auth issues**: "Authentication & RBAC"
- **Implementing new backend features**: "Backend Architecture"
- **Understanding where to place code**: "Backend Architecture"
- **Debugging domain boundaries**: "Backend Architecture"
- **Adding cross-domain functionality**: "Cross-Domain Communication"
- **Understanding domain boundaries**: "Cross-Domain Communication"
- **Implementing reactive updates**: "Cross-Domain Communication"
- **Debugging domain interactions**: "Cross-Domain Communication"
- **Adding database tables or indexes**: "Database & Offline-First"
- **Investigating performance issues**: "Database & Offline-First"
- **Understanding transaction behavior**: "Database & Offline-First"
- **Configuring connection pool**: "Database & Offline-First"
- **Implementing frontend features**: "Frontend Architecture"
- **Understanding state management**: "Frontend Architecture"
- **Creating new components**: "Frontend Architecture"
- **Adding domain functionality**: "Frontend Architecture"
- **Debugging IPC issues**: "IPC Patterns"
- **Implementing cache invalidation**: "IPC Patterns"
- **Creating domain IPC wrappers**: "IPC Patterns"
- **Adding new features**: "Testing Requirements"
- **Fixing bugs**: "Testing Requirements"
- **Understanding test structure**: "Testing Requirements"
- **Writing regression tests**: "Testing Requirements"
- **Adding new IPC payload types**: "Type Generation"
- **Understanding generated types**: "Type Generation"
- **Running type sync**: "Type Generation"
- **Debugging type mismatches**: "Type Generation"
- **Adding new input fields**: "Validation Service"
- **Implementing form validation**: "Validation Service"
- **Creating business rules**: "Validation Service"
- **Understanding validation layers**: "Validation Service"

## Related Files

- [AGENTS.md](../AGENTS.md) - Engineering rules and conventions
- [README.md](../README.md) - Project overview

---

*Generated: 2026-03-12*
