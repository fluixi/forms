/**
 * Standard Schema (https://standardschema.dev): one adapter for every library that implements
 * it, Zod 4, Valibot, ArkType among them. Only the interface is declared here, so nothing is
 * installed for it.
 */
import type { AsyncValidator, ValidationError, Validator } from './types.js';

/** A path segment: a key, or an object carrying one. */
export type StandardPathSegment = PropertyKey | { readonly key: PropertyKey };

export interface StandardIssue {
  readonly message: string;
  readonly path?: ReadonlyArray<StandardPathSegment>;
}

export type StandardResult<Output> =
  | { readonly value: Output; readonly issues?: undefined }
  | { readonly issues: ReadonlyArray<StandardIssue> };

/** The Standard Schema v1 interface, as far as validation needs it. */
export interface StandardSchema<Input = unknown, Output = Input> {
  readonly '~standard': {
    readonly version: 1;
    readonly vendor: string;
    readonly validate: (value: unknown) => StandardResult<Output> | Promise<StandardResult<Output>>;
    readonly types?: { readonly input: Input; readonly output: Output };
  };
}

/** The output type a Standard Schema validates to. */
export type InferStandard<S> = S extends StandardSchema<unknown, infer O> ? O : never;

/** `a.0.b`. Through String(): a symbol key cannot be joined directly. */
export function standardPath(path: ReadonlyArray<StandardPathSegment> = []): string {
  return path.map((segment) => String(typeof segment === 'object' ? segment.key : segment)).join('.');
}

const toError = (issue: StandardIssue): ValidationError => ({
  type: 'schema',
  message: issue.message,
  meta: { path: standardPath(issue.path) },
});

const firstError = (result: StandardResult<unknown>): ValidationError | null =>
  result.issues?.length ? toError(result.issues[0]) : null;

function isPromise<T>(value: T | Promise<T>): value is Promise<T> {
  return typeof (value as Promise<T>)?.then === 'function';
}

/**
 * A validator from a Standard Schema, for a field or a whole form. Its first issue becomes the
 * error; `meta.path` says where it belongs. A schema that validates asynchronously belongs in
 * `asyncValidators` through `standardAsyncValidator`: here it is reported as an error rather
 * than passing unchecked.
 */
export function standardValidator<T>(schema: StandardSchema<unknown, T>): Validator<T> {
  return (value) => {
    const result = schema['~standard'].validate(value);
    if (isPromise(result)) {
      return { type: 'schema', message: 'This schema validates asynchronously: use standardAsyncValidator.' };
    }
    return firstError(result);
  };
}

/** The asynchronous form, for `asyncValidators`: debounced and aborted like any other. */
export function standardAsyncValidator<T>(schema: StandardSchema<unknown, T>): AsyncValidator<T> {
  return async (value) => firstError(await schema['~standard'].validate(value));
}

/** Every issue of a failed validation, grouped by dotted path, for routing to fields. */
export async function standardErrorsByPath(schema: StandardSchema, value: unknown): Promise<Record<string, ValidationError[]>> {
  const result = await schema['~standard'].validate(value);
  const out: Record<string, ValidationError[]> = {};
  for (const issue of result.issues ?? []) (out[standardPath(issue.path)] ??= []).push(toError(issue));
  return out;
}
