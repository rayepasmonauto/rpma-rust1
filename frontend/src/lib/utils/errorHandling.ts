import { toast } from "sonner";
import type { JsonValue } from "@/lib/backend";

// ---------------------------------------------------------------------------
// Backend error codes emitted by safeInvoke (EnhancedError.code)
// Keep in sync with src-tauri/src/shared/ipc/errors.rs & ipc/utils.ts
// ---------------------------------------------------------------------------
const VALIDATION_CODES = new Set(["VALIDATION", "VALIDATION_ERROR"]);
const AUTH_CODES = new Set(["AUTHENTICATION", "AUTH_INVALID"]);
const PERMISSION_CODES = new Set(["AUTHORIZATION", "AUTH_FORBIDDEN"]);
const NOT_FOUND_CODES = new Set(["NOT_FOUND", "NOTFOUND"]);
const SERVER_CODES = new Set([
  "INTERNAL",
  "INTERNAL_ERROR",
  "DATABASE",
  "DATABASE_ERROR",
]);
const NETWORK_CODES = new Set(["NETWORK", "NETWORK_ERROR", "IPC_TIMEOUT"]);

export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum ErrorCategory {
  NETWORK = "network",
  AUTH = "auth",
  VALIDATION = "validation",
  PERMISSION = "permission",
  NOT_FOUND = "not_found",
  SERVER = "server",
  UNKNOWN = "unknown",
}

export interface AppError {
  message: string;
  code?: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  details?: JsonValue;
  timestamp: Date;
  context?: Record<string, unknown>;
  action?: string;
}

/**
 * Create a standardized error object
 */
export function createError(
  message: string,
  category: ErrorCategory = ErrorCategory.UNKNOWN,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM,
  options?: {
    code?: string;
    details?: JsonValue;
    context?: Record<string, unknown>;
    action?: string;
  },
): AppError {
  return {
    message,
    code: options?.code,
    category,
    severity,
    details: options?.details,
    timestamp: new Date(),
    context: options?.context,
    action: options?.action,
  };
}

/**
 * Categorise an error code emitted by the backend / safeInvoke into an
 * {@link ErrorCategory} + {@link ErrorSeverity} pair.
 *
 * The backend sends UPPER_CASE codes such as `VALIDATION`, `NOT_FOUND`,
 * `AUTHENTICATION`, `INTERNAL`, etc.  See `ipc/utils.ts → getUserFriendlyErrorMessage`
 * and `src-tauri/src/shared/ipc/errors.rs` for the canonical list.
 */
export function categorizeError(code: string | undefined | null): {
  category: ErrorCategory;
  severity: ErrorSeverity;
} {
  if (!code)
    return { category: ErrorCategory.UNKNOWN, severity: ErrorSeverity.MEDIUM };

  const upper = code.toUpperCase();

  if (AUTH_CODES.has(upper)) {
    return { category: ErrorCategory.AUTH, severity: ErrorSeverity.HIGH };
  }
  if (PERMISSION_CODES.has(upper)) {
    return { category: ErrorCategory.PERMISSION, severity: ErrorSeverity.HIGH };
  }
  if (VALIDATION_CODES.has(upper)) {
    return { category: ErrorCategory.VALIDATION, severity: ErrorSeverity.LOW };
  }
  if (NOT_FOUND_CODES.has(upper)) {
    return { category: ErrorCategory.NOT_FOUND, severity: ErrorSeverity.LOW };
  }
  if (SERVER_CODES.has(upper)) {
    return { category: ErrorCategory.SERVER, severity: ErrorSeverity.CRITICAL };
  }
  if (NETWORK_CODES.has(upper)) {
    return { category: ErrorCategory.NETWORK, severity: ErrorSeverity.HIGH };
  }

  return { category: ErrorCategory.UNKNOWN, severity: ErrorSeverity.MEDIUM };
}

/**
 * Bridge an `EnhancedError` thrown by `safeInvoke` (ipc/utils.ts) into the
 * centralised {@link AppError} model prescribed by ADR-019.
 *
 * `EnhancedError` carries:
 *   - `.code`            – backend error code (e.g. `VALIDATION`, `NOT_FOUND`)
 *   - `.originalMessage` – raw backend message (before user-friendly rewrite)
 *   - `.details`         – optional structured payload
 *   - `.correlationId`   – trace id for log correlation
 *
 * This function is the **single** place where IPC errors are normalised for
 * the rest of the frontend (hooks, components, display helpers).
 */
export function parseIpcError(
  error: unknown,
  context?: Record<string, unknown>,
): AppError {
  // --- EnhancedError from safeInvoke (most common path) ---
  if (error instanceof Error) {
    const enhanced = error as Error & {
      code?: string;
      originalMessage?: string;
      details?: JsonValue | null;
      correlationId?: string;
    };

    const { category, severity } = categorizeError(enhanced.code);

    return createError(
      enhanced.message || "An unknown error occurred",
      category,
      severity,
      {
        code: enhanced.code,
        details: enhanced.details ?? undefined,
        context: {
          ...context,
          ...(enhanced.correlationId
            ? { correlationId: enhanced.correlationId }
            : {}),
          ...(enhanced.originalMessage
            ? { originalMessage: enhanced.originalMessage }
            : {}),
        },
      },
    );
  }

  // --- Plain object with a `code` field (legacy / edge-case) ---
  if (error && typeof error === "object" && "code" in error) {
    const obj = error as {
      code?: string;
      message?: string;
      details?: JsonValue | null;
    };
    const { category, severity } = categorizeError(obj.code);

    return createError(
      obj.message || "An unknown error occurred",
      category,
      severity,
      {
        code: obj.code,
        details: obj.details ?? undefined,
        context,
      },
    );
  }

  // --- Fallback ---
  return createError(
    "An unexpected error occurred",
    ErrorCategory.UNKNOWN,
    ErrorSeverity.MEDIUM,
    {
      context,
      details: { originalError: String(error) },
    },
  );
}

/**
 * Handle API errors consistently.
 *
 * Delegates to {@link categorizeError} for code→category mapping so that
 * actual backend codes (`VALIDATION`, `NOT_FOUND`, `AUTHENTICATION`, …) are
 * correctly recognised.
 */
export function handleApiError(
  error: unknown,
  context?: Record<string, unknown>,
): AppError {
  // Prefer the full IPC bridge which handles EnhancedError properties
  return parseIpcError(error, context);
}

/**
 * Display error to user with appropriate toast
 */
export function displayError(error: AppError | string | unknown): void {
  let appError: AppError;

  if (typeof error === "string") {
    appError = createError(error);
  } else if (error && typeof error === "object" && "message" in error) {
    appError = error as AppError;
  } else {
    appError = handleApiError(error);
  }

  // Log error for debugging
  console.error("App Error:", appError);

  // Show appropriate toast based on severity
  switch (appError.severity) {
    case ErrorSeverity.CRITICAL:
      toast.error(appError.message, {
        description: "A critical error occurred. Please contact support.",
        duration: 10000,
      });
      break;

    case ErrorSeverity.HIGH:
      toast.error(appError.message, {
        description: appError.details
          ? "Check console for details."
          : undefined,
        duration: 8000,
      });
      break;

    case ErrorSeverity.MEDIUM:
      toast.error(appError.message, {
        duration: 6000,
      });
      break;

    case ErrorSeverity.LOW:
      toast.warning(appError.message, {
        duration: 4000,
      });
      break;
  }
}

/**
 * Display success message
 */
export function displaySuccess(message: string, description?: string): void {
  toast.success(message, {
    description,
    duration: 4000,
  });
}

/**
 * Display info message
 */
export function displayInfo(message: string, description?: string): void {
  toast.info(message, {
    description,
    duration: 4000,
  });
}

/**
 * Display warning message
 */
export function displayWarning(message: string, description?: string): void {
  toast.warning(message, {
    description,
    duration: 5000,
  });
}

/**
 * Custom error class for better error tracking
 */
export class AppException extends Error {
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly context?: Record<string, unknown>;
  public readonly action?: string;

  constructor(
    message: string,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    options?: {
      code?: string;
      details?: Record<string, unknown>;
      context?: Record<string, unknown>;
      action?: string;
    },
  ) {
    super(message);
    this.name = "AppException";
    this.category = category;
    this.severity = severity;
    this.context = options?.context;
    this.action = options?.action;

    // Maintain stack trace for debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON(): AppError {
    return {
      message: this.message,
      category: this.category,
      severity: this.severity,
      context: this.context,
      action: this.action,
      timestamp: new Date(),
    };
  }
}

/**
 * Async error handler wrapper
 */
export function withErrorHandling<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  errorHandler?: (error: AppError) => void,
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      const appError = handleApiError(error);
      errorHandler?.(appError);
      displayError(appError);
      throw appError;
    }
  };
}

/**
 * Check if error is recoverable
 */
export function isRecoverableError(error: AppError): boolean {
  return (
    error.category === ErrorCategory.NETWORK ||
    error.category === ErrorCategory.AUTH ||
    error.category === ErrorCategory.VALIDATION ||
    error.category === ErrorCategory.NOT_FOUND
  );
}

/**
 * Get user-friendly error message based on category
 */
export function getUserFriendlyMessage(error: AppError): string {
  switch (error.category) {
    case ErrorCategory.NETWORK:
      return "Connection issue. Please check your internet connection and try again.";

    case ErrorCategory.AUTH:
      return "Authentication error. Please log in again.";

    case ErrorCategory.VALIDATION:
      return "Please check your input and try again.";

    case ErrorCategory.PERMISSION:
      return "You don't have permission to perform this action.";

    case ErrorCategory.NOT_FOUND:
      return "The requested item was not found.";

    case ErrorCategory.SERVER:
      return "Server error. Please try again later.";

    default:
      return error.message || "An unexpected error occurred.";
  }
}
