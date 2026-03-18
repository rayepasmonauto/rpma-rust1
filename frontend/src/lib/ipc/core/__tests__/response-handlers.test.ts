import { extractAndValidate } from '../response-handlers';

describe('extractAndValidate', () => {
  it('throws on ApiResponse failure instead of returning null', () => {
    expect(() =>
      extractAndValidate({
        success: false,
        error: { message: 'Validation failed' },
      })
    ).toThrow('Validation failed');
  });

  it('throws fallback message when ApiResponse error payload has no message', () => {
    expect(() =>
      extractAndValidate({
        success: false,
        error: 'unexpected failure shape',
      })
    ).toThrow('IPC API call failed');
  });

  it('returns validated data for successful ApiResponse', () => {
    const result = extractAndValidate<{ id: string }>(
      { success: true, data: { id: 'abc' } },
      (data) => {
        const typed = data as { id: string };
        return { id: typed.id };
      }
    );
    expect(result).toEqual({ id: 'abc' });
  });

  it('handles direct response format when no success wrapper is present', () => {
    const result = extractAndValidate<{ id: string }>(
      { id: 'direct-response' },
      (data) => {
        const typed = data as { id: string };
        return { id: typed.id };
      }
    );
    expect(result).toEqual({ id: 'direct-response' });
  });
});
