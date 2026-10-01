import { describe, it, expect } from 'vitest';
import { standardAsyncValidator, standardErrorsByPath, standardValidator, type StandardSchema } from './standard.js';

/** A minimal Standard Schema: a non-empty string. */
const nonEmpty: StandardSchema<unknown, string> = {
  '~standard': {
    version: 1,
    vendor: 'spec',
    validate: (value) =>
      typeof value === 'string' && value.length > 0
        ? { value }
        : { issues: [{ message: 'form.required', path: ['user', { key: 0 }, Symbol('name')] }] },
  },
};

const asyncSchema: StandardSchema<unknown, string> = {
  '~standard': { version: 1, vendor: 'spec', validate: async (value) => (value === 'taken' ? { issues: [{ message: 'taken' }] } : { value: String(value) }) },
};

describe('Standard Schema', () => {
  it('validates through ~standard, with the first issue as the error and its path in meta', () => {
    const validate = standardValidator(nonEmpty);
    expect(validate('Ada', {} as never)).toBeNull();
    expect(validate('', {} as never)).toEqual({ type: 'schema', message: 'form.required', meta: { path: 'user.0.Symbol(name)' } });
  });

  it('reports an asynchronous schema used synchronously instead of passing it', () => {
    expect(standardValidator(asyncSchema)('anything', {} as never)?.type).toBe('schema');
  });

  it('validates asynchronously and groups issues by path', async () => {
    const validate = standardAsyncValidator(asyncSchema);
    expect(await validate('free', {} as never, new AbortController().signal)).toBeNull();
    expect((await validate('taken', {} as never, new AbortController().signal))?.message).toBe('taken');
    expect(Object.keys(await standardErrorsByPath(nonEmpty, ''))).toEqual(['user.0.Symbol(name)']);
  });
});
