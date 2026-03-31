# 03. FRONTEND GUIDE

## Frontend Structure
The frontend is a **Next.js (App Router)** application located in the `frontend/` directory.

### Key Directories
- `frontend/src/app/`: Next.js pages, layouts, and global routing.
- `frontend/src/components/`: Shared UI components (TailwindCSS + shadcn/ui).
- `frontend/src/domains/`: Bounded contexts mirroring the backend (e.g., `tasks`, `interventions`, `auth`). Feature-specific components and hooks live here.
- `frontend/src/lib/ipc/`: Crucial directory containing type-safe IPC client wrappers. **Never use raw `invoke` in UI code.**
- `frontend/src/lib/query-keys.ts`: Single source of truth for TanStack Query keys.
- `frontend/src/types/`: Auto-generated TypeScript types from Rust (`ts-rs`). **Do not hand-edit.**

## State Management
- **Server State**: Managed by `TanStack Query` (ADR-014). Used for fetching, caching, and updating asynchronous data from the Tauri backend.
- **Local/UI State**: Managed by `Zustand` for complex global state (e.g., active intervention session), or standard React `useState` for local component state.

## How Frontend Calls Backend (IPC)
1. **Never call `invoke` directly**: Use the wrappers in `frontend/src/lib/ipc/` (ADR-013).
2. Example flow: Component calls a React Query hook (`useMutation`) -> hook calls an IPC wrapper function in `frontend/src/lib/ipc/tasks.ts` -> the wrapper calls `invoke("create_task", ...)` -> Backend processes.

## Adding a New UI Feature
1. **Identify the Domain**: Place feature-specific logic in `frontend/src/domains/<domain>/`.
2. **Define IPC Call**: Add the type-safe wrapper in `frontend/src/lib/ipc/<domain>.ts`.
3. **Define Query Keys**: Add keys to `frontend/src/lib/query-keys.ts`.
4. **Create Hooks**: Build a custom `useQuery` or `useMutation` hook.
5. **Build UI**: Use shadcn/ui components (`src/components/`) and Tailwind classes.
6. **Zod Validation**: Use `zod` for client-side form validation before sending data via IPC.

## Common Pitfalls
- **Type Drift**: If backend structs change, the frontend will fail to build. Run `npm run types:sync` or `npm run dev:types`.
- **IPC Naming Mismatches**: Ensure the string passed to `invoke()` matches the `#[tauri::command]` name in Rust exactly.
- **Large Payload Handling**: When dealing with images/photos, be cautious of IPC payload limits. Use optimized streaming or base64 compression if necessary (TODO: verify image chunking in code).