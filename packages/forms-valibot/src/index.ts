/**
 * @fluixi/forms-valibot — Valibot adapter. Mirrors forms-zod: a schema becomes a
 * group-level validator (issues routed by path) or a field-level validator.
 */
import type { Validator, ValidationError } from '@fluixi/forms-core';

interface ValibotIssue {
  message: string;
  path?: { key: unknown }[];
}
interface ValibotResult<T> {
  success: boolean;
  output?: T;
  issues?: ValibotIssue[];
}
/** `safeParse` from valibot: `(schema, value) => result`. */
type SafeParse = <T>(schema: unknown, value: unknown) => ValibotResult<T>;

const pathOf = (issue: ValibotIssue) => (issue.path ?? []).map((p) => String(p.key)).join('.');
const mapIssue = (issue: ValibotIssue): ValidationError => ({
  type: 'valibot',
  message: issue.message,
  meta: { path: pathOf(issue) },
});

export function valibotValidator<T>(safeParse: SafeParse, schema: unknown): Validator<T> {
  return (value) => {
    const res = safeParse<T>(schema, value);
    if (res.success) return null;
    const issues = res.issues ?? [];
    if (issues.length === 0) return null;
    return { ...mapIssue(issues[0]), meta: { all: issues.map(mapIssue) } };
  };
}

export function valibotErrorsByPath<T>(
  safeParse: SafeParse,
  schema: unknown,
  value: unknown,
): Record<string, ValidationError[]> {
  const res = safeParse<T>(schema, value);
  const out: Record<string, ValidationError[]> = {};
  for (const issue of res.issues ?? []) (out[pathOf(issue)] ??= []).push(mapIssue(issue));
  return out;
}
