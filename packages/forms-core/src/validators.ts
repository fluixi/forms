/**
 * Built-in validators + composition. Validators are pure `(value, ctx) => error | null`.
 * They run inside a memo, so they're lazy (only re-run when their inputs change) and
 * fine-grained (reading a sibling via `ctx.get(path)` subscribes to just that sibling).
 */
import type { Validator, AsyncValidator, ValidationError } from './types.js';

const err = (type: string, message: string, meta?: Record<string, unknown>): ValidationError => ({
  type,
  message,
  meta,
});

const isEmpty = (v: unknown): boolean =>
  v == null || v === '' || (Array.isArray(v) && v.length === 0);

export const required = (message = 'This field is required'): Validator =>
  (value) => (isEmpty(value) ? err('required', message) : null);

export const requiredTrue = (message = 'Must be checked'): Validator<boolean> =>
  (value) => (value === true ? null : err('requiredTrue', message));

export const minLength = (min: number, message?: string): Validator<string | unknown[]> =>
  (value) =>
    value != null && value.length < min
      ? err('minLength', message ?? `Must be at least ${min} characters`, {
          requiredLength: min,
          actualLength: value.length,
        })
      : null;

export const maxLength = (max: number, message?: string): Validator<string | unknown[]> =>
  (value) =>
    value != null && value.length > max
      ? err('maxLength', message ?? `Must be at most ${max} characters`, {
          requiredLength: max,
          actualLength: value.length,
        })
      : null;

export const min = (m: number, message?: string): Validator<number> =>
  (value) => (value != null && value < m ? err('min', message ?? `Must be ≥ ${m}`, { min: m }) : null);

export const max = (m: number, message?: string): Validator<number> =>
  (value) => (value != null && value > m ? err('max', message ?? `Must be ≤ ${m}`, { max: m }) : null);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const email = (message = 'Invalid email address'): Validator<string> =>
  (value) => (isEmpty(value) || EMAIL_RE.test(value) ? null : err('email', message));

export const pattern = (re: RegExp, message = 'Invalid format'): Validator<string> =>
  (value) => (isEmpty(value) || re.test(value) ? null : err('pattern', message, { pattern: re.source }));

/** Cross-field: the value must equal another field's value (e.g. confirm password). */
export const sameAs = (path: string, message = 'Values must match'): Validator =>
  (value, ctx) => (value === ctx.get(path) ? null : err('sameAs', message, { path }));

/** Run a validator only when `predicate` (typically reads sibling fields) is true. */
export const when = <T>(predicate: (ctx: Parameters<Validator<T>>[1]) => boolean, validator: Validator<T>): Validator<T> =>
  (value, ctx) => (predicate(ctx) ? validator(value, ctx) : null);

/** Compose validators into one — returns the FIRST failure (short-circuits). */
export const compose = <T>(...validators: Validator<T>[]): Validator<T> =>
  (value, ctx) => {
    for (const v of validators) {
      const e = v(value, ctx);
      if (e) return e;
    }
    return null;
  };

/** Run all validators and collect EVERY failure (no short-circuit). */
export const all = <T>(...validators: Validator<T>[]) =>
  (value: T, ctx: Parameters<Validator<T>>[1]): ValidationError[] =>
    validators.map((v) => v(value, ctx)).filter((e): e is ValidationError => e != null);

// ── async helpers ──────────────────────────────────────────────────────────────

/**
 * Wrap a plain async check (returns boolean) as an AsyncValidator. The `signal` aborts a
 * stale run; pass it to your fetch.
 */
export const asyncCheck = <T>(
  check: (value: T, signal: AbortSignal) => Promise<boolean>,
  type: string,
  message: string,
): AsyncValidator<T> =>
  async (value, _ctx, signal) => ((await check(value, signal)) ? null : err(type, message));
