# 03. FRONTEND GUIDE

The frontend is a **Next.js 14** application located in the `frontend/` directory. It uses the **App Router** and follows a domain-driven structure.

## Directory Structure (`frontend/src/`)
- `app/`: Routing, layouts, and page components.
- `components/`: Shared UI components (mostly **shadcn/ui**).
- `domains/`: Feature-specific logic (Tasks, Clients, etc.).
  - `[domain]/api/`: React Query hooks and types.
  - `[domain]/components/`: Domain-specific UI.
  - `[domain]/hooks/`: Custom hooks for the domain.
  - `[domain]/ipc/`: Typed wrappers for Tauri `invoke` calls.
- `lib/`: Core utilities, IPC client, and global constants.
- `types/`: **AUTO-GENERATED** TypeScript types from Rust source (do not edit).

## Key Patterns
- **Data Fetching**: Use **TanStack Query** for all server state. Hooks should be located in `domains/*/api/`.
- **State Management**: **Zustand** for complex UI state; `useState` for simple local state.
- **Form Validation**: Use **Zod** for schema validation in forms.
- **Styling**: Tailwind CSS with a consistent design system based on shadcn/ui.

## Communication with Backend
**Never call `invoke` directly.** Use the typed wrappers in `domains/*/ipc/`.
Example:
```typescript
import { taskIpc } from '@/domains/tasks/ipc';
const tasks = await taskIpc.list({ status: 'Scheduled' });
```

## Adding a New UI Feature
1. **Identify the Domain**: If it doesn't fit existing ones, create a new folder in `frontend/src/domains/`.
2. **Define IPC**: Add typed wrappers in `ipc/` if backend communication is needed.
3. **Create API Hooks**: Add `useQuery` or `useMutation` hooks in `api/`.
4. **Build Components**: Place domain-specific components in `components/`.
5. **Route**: Add the page in `frontend/src/app/`.

## Common Pitfalls
- **Type Drift**: If you change a Rust model, you MUST run `npm run types:sync` to update the TS types.
- **Direct Imports**: Only import from a domain's public API (index.ts) if possible.
- **Prop Drilling**: Use React Context or Zustand for deeply nested state.
