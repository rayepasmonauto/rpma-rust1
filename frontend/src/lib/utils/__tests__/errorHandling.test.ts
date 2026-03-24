/**
 * Unit tests for the centralized error handling utilities.
 *
 * Validates that:
 *  - categorizeError correctly maps real backend error codes to ErrorCategory/ErrorSeverity
 *  - parseIpcError bridges EnhancedError (from safeInvoke) to AppError
 *  - handleApiError delegates to parseIpcError (backwards-compatible)
 *  - getUserFriendlyMessage covers all categories including AUTH
 *  - isRecoverableError includes AUTH category
 */

// Mock sonner before importing anything that depends on it
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  },
}));

import {
  categorizeError,
  parseIpcError,
  handleApiError,
  createError,
  getUserFriendlyMessage,
  isRecoverableError,
  displayError,
  ErrorCategory,
  ErrorSeverity,
  type AppError,
} from '../errorHandling';

// ---------------------------------------------------------------------------
// categorizeError
// ---------------------------------------------------------------------------
describe('categorizeError', () => {
  it.each([
    ['VALIDATION', ErrorCategory.VALIDATION, ErrorSeverity.LOW],
    ['VALIDATION_ERROR', ErrorCategory.VALIDATION, ErrorSeverity.LOW],
    ['validation', ErrorCategory.VALIDATION, ErrorSeverity.LOW],
  ])('maps %s → %s / %s', (code, expectedCategory, expectedSeverity) => {
    const result = categorizeError(code);
    expect(result.category).toBe(expectedCategory);
    expect(result.severity).toBe(expectedSeverity);
  });

  it.each([
    ['AUTHENTICATION', ErrorCategory.AUTH, ErrorSeverity.HIGH],
    ['AUTH_INVALID', ErrorCategory.AUTH, ErrorSeverity.HIGH],
    ['authentication', ErrorCategory.AUTH, ErrorSeverity.HIGH],
  ])('maps %s → %s / %s', (code, expectedCategory, expectedSeverity) => {
    const result = categorizeError(code);
    expect(result.category).toBe(expectedCategory);
    expect(result.severity).toBe(expectedSeverity);
  });

  it.each([
    ['AUTHORIZATION', ErrorCategory.PERMISSION, ErrorSeverity.HIGH],
    ['AUTH_FORBIDDEN', ErrorCategory.PERMISSION, ErrorSeverity.HIGH],
  ])('maps %s → %s / %s', (code, expectedCategory, expectedSeverity) => {
    const result = categorizeError(code);
    expect(result.category).toBe(expectedCategory);
    expect(result.severity).toBe(expectedSeverity);
  });

  it.each([
    ['NOT_FOUND', ErrorCategory.NOT_FOUND, ErrorSeverity.LOW],
    ['NOTFOUND', ErrorCategory.NOT_FOUND, ErrorSeverity.LOW],
  ])('maps %s → %s / %s', (code, expectedCategory, expectedSeverity) => {
    const result = categorizeError(code);
    expect(result.category).toBe(expectedCategory);
    expect(result.severity).toBe(expectedSeverity);
  });

  it.each([
    ['INTERNAL', ErrorCategory.SERVER, ErrorSeverity.CRITICAL],
    ['INTERNAL_ERROR', ErrorCategory.SERVER, ErrorSeverity.CRITICAL],
    ['DATABASE', ErrorCategory.SERVER, ErrorSeverity.CRITICAL],
    ['DATABASE_ERROR', ErrorCategory.SERVER, ErrorSeverity.CRITICAL],
  ])('maps %s → %s / %s', (code, expectedCategory, expectedSeverity) => {
    const result = categorizeError(code);
    expect(result.category).toBe(expectedCategory);
    expect(result.severity).toBe(expectedSeverity);
  });

  it.each([
    ['NETWORK', ErrorCategory.NETWORK, ErrorSeverity.HIGH],
    ['NETWORK_ERROR', ErrorCategory.NETWORK, ErrorSeverity.HIGH],
    ['IPC_TIMEOUT', ErrorCategory.NETWORK, ErrorSeverity.HIGH],
  ])('maps %s → %s / %s', (code, expectedCategory, expectedSeverity) => {
    const result = categorizeError(code);
    expect(result.category).toBe(expectedCategory);
    expect(result.severity).toBe(expectedSeverity);
  });

  it('returns UNKNOWN for null/undefined/empty codes', () => {
    expect(categorizeError(null).category).toBe(ErrorCategory.UNKNOWN);
    expect(categorizeError(undefined).category).toBe(ErrorCategory.UNKNOWN);
    expect(categorizeError('').category).toBe(ErrorCategory.UNKNOWN);
  });

  it('returns UNKNOWN for unrecognised codes', () => {
    expect(categorizeError('SOME_RANDOM_CODE').category).toBe(ErrorCategory.UNKNOWN);
    expect(categorizeError('RATE_LIMIT').category).toBe(ErrorCategory.UNKNOWN);
  });

  it('is case-insensitive', () => {
    expect(categorizeError('validation').category).toBe(ErrorCategory.VALIDATION);
    expect(categorizeError('Validation').category).toBe(ErrorCategory.VALIDATION);
    expect(categorizeError('not_found').category).toBe(ErrorCategory.NOT_FOUND);
    expect(categorizeError('ipc_timeout').category).toBe(ErrorCategory.NETWORK);
  });
});

// ---------------------------------------------------------------------------
// parseIpcError — EnhancedError (Error subclass with .code etc.)
// ---------------------------------------------------------------------------
describe('parseIpcError', () => {
  /** Helper to build an EnhancedError-like object as safeInvoke throws. */
  function makeEnhancedError(overrides: {
    message?: string;
    code?: string;
    originalMessage?: string;
    details?: unknown;
    correlationId?: string;
  }): Error & Record<string, unknown> {
    const err = new Error(overrides.message ?? 'Something went wrong') as Error &
      Record<string, unknown>;
    if (overrides.code !== undefined) err.code = overrides.code;
    if (overrides.originalMessage !== undefined) err.originalMessage = overrides.originalMessage;
    if (overrides.details !== undefined) err.details = overrides.details;
    if (overrides.correlationId !== undefined) err.correlationId = overrides.correlationId;
    return err;
  }

  it('converts VALIDATION EnhancedError to VALIDATION AppError', () => {
    const err = makeEnhancedError({
      message: 'Les données saisies ne sont pas valides.',
      code: 'VALIDATION',
      originalMessage: 'Invalid email format',
    });

    const result = parseIpcError(err);

    expect(result.category).toBe(ErrorCategory.VALIDATION);
    expect(result.severity).toBe(ErrorSeverity.LOW);
    expect(result.code).toBe('VALIDATION');
    expect(result.message).toBe('Les données saisies ne sont pas valides.');
    expect(result.context?.originalMessage).toBe('Invalid email format');
  });

  it('converts AUTHENTICATION EnhancedError to AUTH AppError', () => {
    const err = makeEnhancedError({
      message: "Erreur d'authentification. Veuillez vous reconnecter.",
      code: 'AUTHENTICATION',
      correlationId: 'corr-123',
    });

    const result = parseIpcError(err);

    expect(result.category).toBe(ErrorCategory.AUTH);
    expect(result.severity).toBe(ErrorSeverity.HIGH);
    expect(result.context?.correlationId).toBe('corr-123');
  });

  it('converts AUTH_FORBIDDEN EnhancedError to PERMISSION AppError', () => {
    const err = makeEnhancedError({
      message: "Vous n'avez pas les permissions nécessaires.",
      code: 'AUTH_FORBIDDEN',
    });

    const result = parseIpcError(err);

    expect(result.category).toBe(ErrorCategory.PERMISSION);
    expect(result.severity).toBe(ErrorSeverity.HIGH);
  });

  it('converts NOT_FOUND EnhancedError to NOT_FOUND AppError', () => {
    const err = makeEnhancedError({
      message: "L'élément demandé n'a pas été trouvé.",
      code: 'NOT_FOUND',
    });

    const result = parseIpcError(err);

    expect(result.category).toBe(ErrorCategory.NOT_FOUND);
    expect(result.severity).toBe(ErrorSeverity.LOW);
  });

  it('converts INTERNAL EnhancedError to SERVER AppError', () => {
    const err = makeEnhancedError({
      message: 'Erreur interne du serveur.',
      code: 'INTERNAL',
    });

    const result = parseIpcError(err);

    expect(result.category).toBe(ErrorCategory.SERVER);
    expect(result.severity).toBe(ErrorSeverity.CRITICAL);
  });

  it('converts IPC_TIMEOUT to NETWORK AppError', () => {
    const err = makeEnhancedError({
      message: 'IPC call to task_list timed out after 15000ms',
      code: 'IPC_TIMEOUT',
      correlationId: 'corr-456',
    });

    const result = parseIpcError(err);

    expect(result.category).toBe(ErrorCategory.NETWORK);
    expect(result.severity).toBe(ErrorSeverity.HIGH);
  });

  it('converts DATABASE_ERROR to SERVER AppError', () => {
    const err = makeEnhancedError({
      message: 'Erreur de base de données.',
      code: 'DATABASE_ERROR',
    });

    const result = parseIpcError(err);

    expect(result.category).toBe(ErrorCategory.SERVER);
    expect(result.severity).toBe(ErrorSeverity.CRITICAL);
  });

  it('preserves details from EnhancedError', () => {
    const details = { fields: { email: 'invalid format' } };
    const err = makeEnhancedError({
      message: 'Validation error',
      code: 'VALIDATION_ERROR',
      details,
    });

    const result = parseIpcError(err);

    expect(result.details).toEqual(details);
  });

  it('handles Error without code as UNKNOWN', () => {
    const err = new Error('Something unexpected happened');

    const result = parseIpcError(err);

    expect(result.category).toBe(ErrorCategory.UNKNOWN);
    expect(result.severity).toBe(ErrorSeverity.MEDIUM);
    expect(result.message).toBe('Something unexpected happened');
  });

  it('merges provided context with EnhancedError metadata', () => {
    const err = makeEnhancedError({
      message: 'Error',
      code: 'NOT_FOUND',
      correlationId: 'corr-789',
      originalMessage: 'Task not found: abc123',
    });

    const result = parseIpcError(err, { component: 'TaskView', taskId: 'abc123' });

    expect(result.context).toEqual(
      expect.objectContaining({
        component: 'TaskView',
        taskId: 'abc123',
        correlationId: 'corr-789',
        originalMessage: 'Task not found: abc123',
      }),
    );
  });

  // --- Plain object with code (legacy / edge-case path) ---
  it('handles plain object with code field', () => {
    const obj = { code: 'VALIDATION', message: 'Bad input', details: null };

    const result = parseIpcError(obj);

    expect(result.category).toBe(ErrorCategory.VALIDATION);
    expect(result.code).toBe('VALIDATION');
    expect(result.message).toBe('Bad input');
  });

  // --- Fallback for primitive / unknown ---
  it('handles string error as UNKNOWN', () => {
    const result = parseIpcError('boom');

    expect(result.category).toBe(ErrorCategory.UNKNOWN);
    expect(result.severity).toBe(ErrorSeverity.MEDIUM);
    expect(result.details).toEqual({ originalError: 'boom' });
  });

  it('handles null/undefined as UNKNOWN', () => {
    expect(parseIpcError(null).category).toBe(ErrorCategory.UNKNOWN);
    expect(parseIpcError(undefined).category).toBe(ErrorCategory.UNKNOWN);
  });

  it('includes a timestamp', () => {
    const before = new Date();
    const result = parseIpcError(new Error('test'));
    const after = new Date();

    expect(result.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(result.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
  });
});

// ---------------------------------------------------------------------------
// handleApiError — should delegate to parseIpcError (backwards-compatible)
// ---------------------------------------------------------------------------
describe('handleApiError', () => {
  it('delegates to parseIpcError and returns same result', () => {
    const err = Object.assign(new Error('Not allowed'), {
      code: 'AUTH_FORBIDDEN',
      correlationId: 'c-1',
    });

    const fromHandle = handleApiError(err, { op: 'test' });
    const fromParse = parseIpcError(err, { op: 'test' });

    // Should produce equivalent AppError (timestamps may differ by a ms)
    expect(fromHandle.category).toBe(fromParse.category);
    expect(fromHandle.severity).toBe(fromParse.severity);
    expect(fromHandle.code).toBe(fromParse.code);
    expect(fromHandle.message).toBe(fromParse.message);
  });

  it('maps VALIDATION correctly (regression: old startsWith never matched)', () => {
    const err = Object.assign(new Error('Bad data'), { code: 'VALIDATION' });
    const result = handleApiError(err);

    expect(result.category).toBe(ErrorCategory.VALIDATION);
    expect(result.severity).toBe(ErrorSeverity.LOW);
  });

  it('maps NOT_FOUND correctly (regression: old startsWith never matched)', () => {
    const err = Object.assign(new Error('Gone'), { code: 'NOT_FOUND' });
    const result = handleApiError(err);

    expect(result.category).toBe(ErrorCategory.NOT_FOUND);
  });

  it('maps INTERNAL correctly (regression: old startsWith never matched)', () => {
    const err = Object.assign(new Error('Oops'), { code: 'INTERNAL' });
    const result = handleApiError(err);

    expect(result.category).toBe(ErrorCategory.SERVER);
    expect(result.severity).toBe(ErrorSeverity.CRITICAL);
  });
});

// ---------------------------------------------------------------------------
// getUserFriendlyMessage — should cover the new AUTH category
// ---------------------------------------------------------------------------
describe('getUserFriendlyMessage', () => {
  const make = (category: ErrorCategory): AppError =>
    createError('raw msg', category, ErrorSeverity.MEDIUM);

  it('returns auth message for AUTH category', () => {
    const msg = getUserFriendlyMessage(make(ErrorCategory.AUTH));
    expect(msg).toMatch(/log in again/i);
  });

  it('returns network message for NETWORK category', () => {
    const msg = getUserFriendlyMessage(make(ErrorCategory.NETWORK));
    expect(msg).toMatch(/connection/i);
  });

  it('returns validation message for VALIDATION category', () => {
    const msg = getUserFriendlyMessage(make(ErrorCategory.VALIDATION));
    expect(msg).toMatch(/input/i);
  });

  it('returns permission message for PERMISSION category', () => {
    const msg = getUserFriendlyMessage(make(ErrorCategory.PERMISSION));
    expect(msg).toMatch(/permission/i);
  });

  it('returns not found message for NOT_FOUND category', () => {
    const msg = getUserFriendlyMessage(make(ErrorCategory.NOT_FOUND));
    expect(msg).toMatch(/not found/i);
  });

  it('returns server message for SERVER category', () => {
    const msg = getUserFriendlyMessage(make(ErrorCategory.SERVER));
    expect(msg).toMatch(/server/i);
  });

  it('returns original message for UNKNOWN category', () => {
    const msg = getUserFriendlyMessage(make(ErrorCategory.UNKNOWN));
    expect(msg).toBe('raw msg');
  });
});

// ---------------------------------------------------------------------------
// isRecoverableError — AUTH should be recoverable
// ---------------------------------------------------------------------------
describe('isRecoverableError', () => {
  const make = (category: ErrorCategory): AppError =>
    createError('err', category, ErrorSeverity.MEDIUM);

  it.each([
    ErrorCategory.NETWORK,
    ErrorCategory.AUTH,
    ErrorCategory.VALIDATION,
    ErrorCategory.NOT_FOUND,
  ])('considers %s recoverable', (category) => {
    expect(isRecoverableError(make(category))).toBe(true);
  });

  it.each([
    ErrorCategory.PERMISSION,
    ErrorCategory.SERVER,
    ErrorCategory.UNKNOWN,
  ])('considers %s NOT recoverable', (category) => {
    expect(isRecoverableError(make(category))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// displayError — smoke test (just verify it doesn't throw)
// ---------------------------------------------------------------------------
describe('displayError', () => {
  it('handles string input without throwing', () => {
    expect(() => displayError('test error')).not.toThrow();
  });

  it('handles AppError input without throwing', () => {
    const appError = createError('test', ErrorCategory.VALIDATION, ErrorSeverity.LOW);
    expect(() => displayError(appError)).not.toThrow();
  });

  it('handles unknown input without throwing', () => {
    expect(() => displayError(42)).not.toThrow();
    expect(() => displayError(null)).not.toThrow();
  });
});
