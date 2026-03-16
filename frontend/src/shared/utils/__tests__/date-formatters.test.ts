import {
  formatDate,
  formatDateTime,
  formatDateTimeShort,
  formatDateTimeCompact,
  formatTime,
  formatRelativeDate,
  formatDateLong,
} from '../date-formatters';

// Fix a reference date so tests are deterministic.
// All assertions use a fixed ISO string so locale formatting is consistent.
const ISO = '2024-01-15T14:30:00.000Z';

// The exact formatted string depends on the Node.js ICU data and the runtime
// locale. We test structural invariants (not empty, not fallback, contains
// expected fragments) rather than byte-for-byte output to keep tests stable
// across environments.

describe('formatDate', () => {
  it('returns a non-empty string for a valid ISO date', () => {
    const result = formatDate(ISO);
    expect(typeof result).toBe('string');
    expect(result).not.toBe('—');
  });

  it('returns the fallback for null', () => {
    expect(formatDate(null)).toBe('—');
  });

  it('returns the fallback for undefined', () => {
    expect(formatDate(undefined)).toBe('—');
  });

  it('returns the fallback for an empty string', () => {
    expect(formatDate('')).toBe('—');
  });

  it('returns a custom fallback when provided', () => {
    expect(formatDate(null, 'N/A')).toBe('N/A');
  });

  it('accepts a Date object', () => {
    const result = formatDate(new Date(ISO));
    expect(typeof result).toBe('string');
    expect(result).not.toBe('—');
  });

  it('accepts a numeric timestamp', () => {
    const result = formatDate(new Date(ISO).getTime());
    expect(typeof result).toBe('string');
    expect(result).not.toBe('—');
  });
});

describe('formatDateTime', () => {
  it('returns a non-empty string for a valid ISO date', () => {
    const result = formatDateTime(ISO);
    expect(typeof result).toBe('string');
    expect(result).not.toBe('—');
  });

  it('returns the fallback for null', () => {
    expect(formatDateTime(null)).toBe('—');
  });

  it('contains both date and time information', () => {
    // The result should have at least one colon (time separator)
    const result = formatDateTime(ISO);
    expect(result).toMatch(/:/);
  });
});

describe('formatDateTimeShort', () => {
  it('returns a non-empty string for a valid ISO date', () => {
    const result = formatDateTimeShort(ISO);
    expect(typeof result).toBe('string');
    expect(result).not.toBe('—');
  });

  it('returns the fallback for null', () => {
    expect(formatDateTimeShort(null)).toBe('—');
  });

  it('contains time information', () => {
    const result = formatDateTimeShort(ISO);
    expect(result).toMatch(/:/);
  });
});

describe('formatDateTimeCompact', () => {
  it('returns a non-empty string for a valid ISO date', () => {
    const result = formatDateTimeCompact(ISO);
    expect(typeof result).toBe('string');
    expect(result).not.toBe('—');
  });

  it('returns the fallback for null', () => {
    expect(formatDateTimeCompact(null)).toBe('—');
  });
});

describe('formatTime', () => {
  it('returns a non-empty string for a valid ISO date string', () => {
    const result = formatTime(ISO);
    expect(typeof result).toBe('string');
    expect(result).not.toBe('Non défini');
    expect(result).not.toBe('Heure invalide');
  });

  it('returns the default fallback for null', () => {
    expect(formatTime(null)).toBe('Non défini');
  });

  it('returns the default fallback for undefined', () => {
    expect(formatTime(undefined)).toBe('Non défini');
  });

  it('returns a custom fallback when provided', () => {
    expect(formatTime(null, 'Pas défini')).toBe('Pas défini');
  });

  it('contains a colon separator', () => {
    const result = formatTime(ISO);
    expect(result).toMatch(/:/);
  });
});

describe('formatRelativeDate', () => {
  it("returns 'Aujourd'hui' for today's date", () => {
    const today = new Date().toISOString().split('T')[0];
    expect(formatRelativeDate(`${today}T00:00:00.000Z`)).toBe("Aujourd'hui");
  });

  it("returns 'Demain' for tomorrow's date", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    expect(formatRelativeDate(`${tomorrowStr}T00:00:00.000Z`)).toBe('Demain');
  });

  it('returns a formatted string for a past date', () => {
    const result = formatRelativeDate('2020-06-15T00:00:00.000Z');
    expect(typeof result).toBe('string');
    expect(result).not.toBe("Aujourd'hui");
    expect(result).not.toBe('Demain');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns the fallback for an invalid date string', () => {
    expect(formatRelativeDate('not-a-date')).toBe('—');
  });
});

describe('formatDateLong', () => {
  it('returns a non-empty string for a valid ISO date', () => {
    const result = formatDateLong(ISO);
    expect(typeof result).toBe('string');
    expect(result).not.toBe('—');
  });

  it('returns the fallback for null', () => {
    expect(formatDateLong(null)).toBe('—');
  });

  it('includes day-of-week information (longer than plain date)', () => {
    const longResult = formatDateLong(ISO);
    const shortResult = formatDate(ISO);
    // Long format includes weekday, so it should be longer
    expect(longResult.length).toBeGreaterThanOrEqual(shortResult.length);
  });
});
