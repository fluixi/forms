import { describe, it, expect } from 'vitest';
import { fromZod } from './index.js';

// A minimal zod-like object schema (safeParse + shape) so the test needs no zod install.
const str = (opts: { email?: boolean; min?: number } = {}) => ({
  safeParse(v: unknown) {
    if (typeof v !== 'string') return { success: false, error: { issues: [{ path: [], message: 'Expected string', code: 'type' }] } };
    if (opts.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v))
      return { success: false, error: { issues: [{ path: [], message: 'Invalid email', code: 'email' }] } };
    if (opts.min != null && v.length < opts.min)
      return { success: false, error: { issues: [{ path: [], message: `Min ${opts.min}`, code: 'min' }] } };
    return { success: true, data: v };
  },
});
const num = (opts: { min?: number } = {}) => ({
  safeParse(v: unknown) {
    if (typeof v !== 'number') return { success: false, error: { issues: [{ path: [], message: 'Expected number', code: 'type' }] } };
    if (opts.min != null && v < opts.min)
      return { success: false, error: { issues: [{ path: [], message: `≥ ${opts.min}`, code: 'min' }] } };
    return { success: true, data: v };
  },
});

// z.object({ email, age }): a per-field shape and a whole-object safeParse.
const Schema = {
  shape: { email: str({ email: true }), age: num({ min: 18 }) },
  safeParse(v: any) {
    const e: any[] = [];
    const er = (Schema.shape.email as any).safeParse(v?.email);
    if (!er.success) e.push({ ...er.error.issues[0], path: ['email'] });
    const ar = (Schema.shape.age as any).safeParse(v?.age);
    if (!ar.success) e.push({ ...ar.error.issues[0], path: ['age'] });
    return e.length ? { success: false, error: { issues: e } } : { success: true, data: v };
  },
} as any;

describe('fromZod', () => {
  it('generates a typed form with per-field validation from a schema', () => {
    const form = fromZod<{ email: string; age: number }>(Schema, { email: '', age: 0 });

    // structure + initial values
    expect(form.get('email').value()).toBe('');
    expect(form.get('age').value()).toBe(0);

    // per-field validation derived from each sub-schema
    expect(form.get('email').valid()).toBe(false); // '' is not a valid email
    expect(form.get('age').valid()).toBe(false); // 0 < 18
    expect(form.valid()).toBe(false);

    form.get('email').setValue('ada@example.com');
    form.get('age').setValue(30);
    expect(form.get('email').valid()).toBe(true);
    expect(form.get('age').valid()).toBe(true);
    expect(form.valid()).toBe(true);
    expect(form.value()).toEqual({ email: 'ada@example.com', age: 30 });
  });

  it('submit gates on the generated validators', async () => {
    const form = fromZod<{ email: string; age: number }>(Schema, { email: 'x@y.z', age: 10 });
    expect(await form.submit(() => {})).toBe(false); // age 10 < 18
    form.get('age').setValue(21);
    expect(await form.submit(() => {})).toBe(true);
  });
});
