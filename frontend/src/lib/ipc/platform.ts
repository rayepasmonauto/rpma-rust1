/**
 * Platform abstraction layer for Tauri platform APIs.
 *
 * ADR-013 mandates that **all** `@tauri-apps` imports live inside `lib/ipc/`.
 * This module wraps platform-level APIs (dialogs, event listeners) so that
 * the rest of the codebase never imports from `@tauri-apps` directly.
 *
 * Every export gracefully degrades when running outside a Tauri context
 * (SSR, browser-only dev, unit-test runners) by checking for
 * `window.__TAURI_INTERNALS__`.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Options accepted by {@link showSaveDialog}. */
export interface SaveDialogOptions {
  /** Window title for the native save dialog. */
  title?: string;
  /** Suggested default file path / name. */
  defaultPath?: string;
  /** File-type filters shown in the dialog. */
  filters?: Array<{ name: string; extensions: string[] }>;
}

/** Callback supplied to {@link listenToEvent}. */
export type EventCallback<T> = (event: { payload: T }) => void;

/** Function returned by {@link listenToEvent} to unsubscribe. */
export type UnlistenFn = () => void;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns `true` when the current runtime is a full Tauri context with both
 * `invoke` and `transformCallback` available.
 */
export function isTauriEnvironment(): boolean {
  if (typeof window === 'undefined') return false;

  const internals = (
    window as Window & {
      __TAURI_INTERNALS__?: { transformCallback?: unknown; invoke?: unknown };
    }
  ).__TAURI_INTERNALS__;

  return (
    !!internals &&
    typeof internals.invoke === 'function' &&
    typeof internals.transformCallback === 'function'
  );
}

// ---------------------------------------------------------------------------
// Dialog wrappers
// ---------------------------------------------------------------------------

/**
 * Opens the native **Save** dialog and returns the chosen path, or `null` if
 * the user cancelled.
 *
 * Wraps `@tauri-apps/plugin-dialog` → `save()`.  Uses a dynamic import so
 * the plugin is only pulled in when actually needed.
 *
 * @throws {Error} When called outside a Tauri environment.
 */
export async function showSaveDialog(
  options: SaveDialogOptions = {},
): Promise<string | null> {
  if (!isTauriEnvironment()) {
    throw new Error(
      '[platform] showSaveDialog is only available inside a Tauri context.',
    );
  }

  const { save } = await import('@tauri-apps/plugin-dialog');
  return save(options);
}

// ---------------------------------------------------------------------------
// Event wrappers
// ---------------------------------------------------------------------------

/**
 * Subscribes to a Tauri backend event and returns an unlisten function.
 *
 * Wraps `@tauri-apps/api/event` → `listen()`.
 *
 * In non-Tauri environments the call is a **no-op** that resolves to an empty
 * unlisten function, so callers don't need to guard manually.
 */
export async function listenToEvent<T = unknown>(
  eventName: string,
  handler: EventCallback<T>,
): Promise<UnlistenFn> {
  if (!isTauriEnvironment()) {
    // Return a no-op unlisten so callers don't need extra guards.
    return () => {};
  }

  const { listen } = await import('@tauri-apps/api/event');
  return listen<T>(eventName, handler);
}
