import { describe, it, expect } from 'vitest';
import { zodErrorsByPath, zodFieldValidator } from './index.js';

// Zod 4's shape: issue paths are PropertyKey[], so a symbol key is possible.
const failing = {
  safeParse: (_value: unknown) => ({
    success: false as const,
    error: { issues: [{ path: ['user', 0, Symbol('meta')] as PropertyKey[], message: 'form.required', code: 'custom' }] },
  }),
};

describe('Zod 4 issue paths', () => {
  it('accepts a schema whose paths are PropertyKey[], and joins a symbol key', () => {
    const validate = zodFieldValidator<string>(failing);
    const error = validate('', {} as never);
    expect(error?.message).toBe('form.required');
    expect(error?.meta).toEqual({ path: 'user.0.Symbol(meta)' });
    expect(Object.keys(zodErrorsByPath(failing, {}))).toEqual(['user.0.Symbol(meta)']);
  });
});
