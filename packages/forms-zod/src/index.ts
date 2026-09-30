/**
 * @fluixi/forms-zod — Zod adapter.
 *
 * Two integration levels:
 *   zodValidator(schema)     — a form-level Validator that runs schema.safeParse and maps
 *                              Zod issues to per-path ValidationErrors (attach to a group).
 *   zodField(schema, initial)— a single field whose validator is derived from a Zod type.
 *
 * Typing: `z.infer<typeof schema>` is the form value type, so values/errors stay typed.
 */
import { createField, createForm } from '@fluixi/forms-core';
import type {
  Validator,
  ValidationError,
  FieldControl,
  FormControl,
} from '@fluixi/forms-core';

// Minimal structural types so this package doesn't hard-depend on a zod version.
interface ZodIssue {
  /** Zod 4 types it as PropertyKey[]: a symbol key is possible. */
  path: ReadonlyArray<PropertyKey>;
  message: string;
  code: string;
}
interface ZodResult<T> {
  success: boolean;
  data?: T;
  error?: { issues: ZodIssue[] };
}
interface ZodLike<T> {
  safeParse(value: unknown): ZodResult<T>;
}

/** `a.0.b`. Through String(): join() throws on a symbol key. */
const joinPath = (path: ReadonlyArray<PropertyKey>): string => path.map(String).join('.');

const mapIssue = (issue: ZodIssue): ValidationError => ({
  type: issue.code || 'zod',
  message: issue.message,
  meta: { path: joinPath(issue.path) },
});

/**
 * A group-level validator from a Zod schema. The returned errors carry `meta.path` so a
 * UI can route each to its field; the group's `errors()` aggregates them.
 */
export function zodValidator<T>(schema: ZodLike<T>): Validator<T> {
  return (value) => {
    const res = schema.safeParse(value);
    if (res.success) return null;
    const issues = res.error?.issues ?? [];
    // Validators return one error; we fold the first and stash the rest in meta so the
    // group sees the full set. (Field-level mapping uses `zodErrorsByPath` below.)
    if (issues.length === 0) return null;
    return { ...mapIssue(issues[0]), meta: { ...issues[0], all: issues.map(mapIssue) } };
  };
}

/** Map a Zod safeParse failure to errors grouped by dotted field path (for routing to fields). */
export function zodErrorsByPath<T>(schema: ZodLike<T>, value: unknown): Record<string, ValidationError[]> {
  const res = schema.safeParse(value);
  const out: Record<string, ValidationError[]> = {};
  if (res.success) return out;
  for (const issue of res.error?.issues ?? []) {
    const key = joinPath(issue.path);
    (out[key] ??= []).push(mapIssue(issue));
  }
  return out;
}

/** Field-level validator from a Zod type (validates a single value). */
export function zodFieldValidator<T>(schema: ZodLike<T>, message?: string): Validator<T> {
  return (value) => {
    const res = schema.safeParse(value);
    if (res.success) return null;
    const issue = res.error?.issues?.[0];
    return issue ? { ...mapIssue(issue), message: message ?? issue.message } : { type: 'zod', message: message ?? 'Invalid' };
  };
}

export type InferZod<S> = S extends ZodLike<infer T> ? T : never;

// ── Schema → form generation ────────────────────────────────────────────────────

interface ZodObjectLike<T> extends ZodLike<T> {
  /** zod object's per-key sub-schemas. */
  shape: { [K in keyof T]: ZodLike<T[K]> };
}

/**
 * Generate a fully-typed form from a Zod object schema.
 *
 *   const Schema = z.object({ email: z.string().email(), age: z.number().min(18) });
 *   const form = fromZod(Schema, { email: '', age: 0 });
 *   form.get('email')        // FieldControl<string>, validated by the email sub-schema
 *   form.value()             // { email: string; age: number }   (typed)
 *
 * Each key becomes a field validated by its sub-schema (field-level errors), and the whole
 * schema is attached as a group-level validator too (so refinements / cross-field rules
 * defined on the object surface as group errors, routed by `meta.path`).
 */
export function fromZod<T extends Record<string, unknown>>(
  schema: ZodObjectLike<T>,
  initial: T,
): FormControl<{ [K in keyof T]: FieldControl<T[K]> }> {
  const controls = {} as { [K in keyof T]: FieldControl<T[K]> };
  for (const key in schema.shape) {
    // createField widens fresh literals (FieldControl<Widen<V>>); here V is the schema's
    // concrete type, so Widen<V> ≡ V, but TS can't prove that for a generic — cast.
    controls[key] = createField(initial[key], {
      validators: [zodFieldValidator(schema.shape[key])],
    }) as FieldControl<T[typeof key]>;
  }
  // T is structurally GroupValue<{[K]: FieldControl<T[K]>}>, but TS can't equate the mapped
  // type — cast the schema validator to the group's value validator.
  return createForm(controls, {
    validators: [zodValidator(schema) as Validator<any>],
  }) as FormControl<{ [K in keyof T]: FieldControl<T[K]> }>;
}
