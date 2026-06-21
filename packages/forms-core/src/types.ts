/**
 * @fluixi/forms-core — public types.
 *
 * The model is signal-native: every reactive read is an `Accessor<T>` (a zero-arg getter
 * that subscribes the caller fine-grainedly), never a snapshot object. Reading
 * `field.valid()` subscribes ONLY to that field's validity memo, so an unrelated field
 * changing never re-runs your computation.
 */
import type { Accessor } from '@fluixi/reactive/signal';

export type { Accessor };

/** A single validation failure. `type` is a stable machine key; `message` is for humans. */
export interface ValidationError {
  type: string;
  message?: string;
  /** validator-specific payload (e.g. `{ requiredLength: 5, actualLength: 3 }`). */
  meta?: Record<string, unknown>;
}

/** Context passed to validators — lets a validator read sibling fields, the root, etc. */
export interface ValidatorContext {
  /** The control being validated. */
  control: AnyControl;
  /** Walk up to a named ancestor value (e.g. the password for a confirm-password check). */
  get<T = unknown>(path: string): T | undefined;
  /** The root form control. */
  root: AnyControl;
}

/** Synchronous validator: pure, returns an error or `null`. Runs inside a memo. */
export type Validator<T = unknown> = (value: T, ctx: ValidatorContext) => ValidationError | null;

/**
 * Async validator: returns a Promise of an error or `null`. Runs debounced, off the sync
 * path, and toggles `pending`. `signal` aborts a stale run when the value changes again.
 */
export type AsyncValidator<T = unknown> = (
  value: T,
  ctx: ValidatorContext,
  signal: AbortSignal,
) => Promise<ValidationError | null>;

export type UpdateOptions = {
  /** Skip marking the control dirty (e.g. programmatic patch). Default false. */
  pristine?: boolean;
  /** Skip running validators for this update (rare). Default false. */
  novalidate?: boolean;
  /** Don't propagate to dependents/parents this tick. Default false. */
  silent?: boolean;
};

export type ControlKind = 'field' | 'group' | 'array';

/** State common to every control kind (field / group / array). */
export interface ControlState<T> {
  readonly kind: ControlKind;
  /** Current value (deep for groups/arrays). */
  value: Accessor<T>;
  /** The value the control was constructed/last-reset with. */
  initialValue: Accessor<T>;

  /** All errors for this control (own + async; groups/arrays aggregate descendants). */
  errors: Accessor<ValidationError[]>;
  /** First error, or undefined. */
  error: Accessor<ValidationError | undefined>;

  valid: Accessor<boolean>;
  invalid: Accessor<boolean>;
  /** An async validator is currently running somewhere in this control's subtree. */
  pending: Accessor<boolean>;

  touched: Accessor<boolean>;
  untouched: Accessor<boolean>;
  /** value !== initialValue (by the configured equality). */
  dirty: Accessor<boolean>;
  pristine: Accessor<boolean>;

  disabled: Accessor<boolean>;
  enabled: Accessor<boolean>;

  /** How many times the enclosing form was submitted (propagated from the root). */
  submitCount: Accessor<number>;
}

/** Mutations + lifecycle common to every control. */
export interface ControlApi<T> {
  setValue(value: T, opts?: UpdateOptions): void;
  /** Shallow/partial update — merges for groups, replaces for fields. */
  patch(value: PartialDeep<T>, opts?: UpdateOptions): void;
  /** Reset to `value` (or the initial value) and clear touched/dirty. */
  reset(value?: T): void;

  markTouched(touched?: boolean): void;
  markDirty(dirty?: boolean): void;
  setDisabled(disabled: boolean): void;

  /** Force-run sync + async validators now; resolves to the resulting validity. */
  validate(): Promise<boolean>;

  /** Tear down effects/subscriptions (called automatically when owned by a reactive root). */
  dispose(): void;
}

export type Control<T> = ControlState<T> & ControlApi<T>;
export type AnyControl = Control<any>;

// ── Field ────────────────────────────────────────────────────────────────────

export interface FieldOptions<T> {
  validators?: Validator<T>[];
  asyncValidators?: AsyncValidator<T>[];
  /** Debounce (ms) before async validators run. Default 250. */
  debounce?: number;
  disabled?: boolean;
  /** Equality used for dirty tracking. Default `Object.is`. */
  equals?: (a: T, b: T) => boolean;
}

export interface FieldControl<T> extends Control<T> {
  readonly kind: 'field';
}

// ── Group ────────────────────────────────────────────────────────────────────

/** A map of child controls. */
export type ControlsRecord = Record<string, AnyControl>;

/** Infer the aggregated value type of a controls record. */
export type GroupValue<C extends ControlsRecord> = {
  [K in keyof C]: C[K] extends Control<infer V> ? V : never;
};

export interface GroupOptions<C extends ControlsRecord> {
  validators?: Validator<GroupValue<C>>[];
  asyncValidators?: AsyncValidator<GroupValue<C>>[];
  disabled?: boolean;
}

export interface GroupControl<C extends ControlsRecord> extends Control<GroupValue<C>> {
  readonly kind: 'group';
  readonly controls: C;
  /** Typed access to a child by key. */
  get<K extends keyof C>(key: K): C[K];
  /** Add a control at runtime (dynamic forms). */
  addControl<K extends string, V>(key: K, control: Control<V>): void;
  /** Remove a control at runtime. */
  removeControl(key: keyof C): void;
}

// ── Array ────────────────────────────────────────────────────────────────────

export interface ArrayOptions<T> {
  validators?: Validator<T[]>[];
  asyncValidators?: AsyncValidator<T[]>[];
  disabled?: boolean;
}

export interface ArrayControl<TItem, TCtrl extends Control<TItem> = Control<TItem>>
  extends Control<TItem[]> {
  readonly kind: 'array';
  /** Reactive list of child controls (keyed by stable identity). */
  controls: Accessor<TCtrl[]>;
  length: Accessor<number>;
  at(index: number): TCtrl | undefined;
  push(control: TCtrl): void;
  insert(index: number, control: TCtrl): void;
  removeAt(index: number): void;
  move(from: number, to: number): void;
  clear(): void;
}

// ── Form (root group) ─────────────────────────────────────────────────────────

export interface FormControl<C extends ControlsRecord> extends GroupControl<C> {
  /** Submission state. */
  submitting: Accessor<boolean>;
  submitted: Accessor<boolean>;
  /**
   * Run validation (incl. async), and if valid call `onValid(values)`. Marks all fields
   * touched, increments submitCount, and tracks `submitting`.
   */
  submit(onValid: (values: GroupValue<C>) => unknown | Promise<unknown>): Promise<boolean>;
}

// ── Utility types ─────────────────────────────────────────────────────────────

/**
 * Widen a fresh literal to its primitive base, so `createField('')` is `FieldControl<string>`
 * (not `FieldControl<''>`). TS normally widens a bare type-parameter inferred from a literal,
 * but `T` also appears contravariantly in `FieldOptions<T>` (the validator param), which
 * suppresses that widening — so we widen explicitly at the boundary. Non-primitives pass
 * through unchanged; pass an explicit type arg to keep a literal union (e.g. a select).
 */
export type Widen<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T extends bigint
        ? bigint
        : T;

export type PartialDeep<T> = T extends (infer U)[]
  ? PartialDeep<U>[]
  : T extends object
    ? { [K in keyof T]?: PartialDeep<T[K]> }
    : T;

/** Dotted/bracketed paths into a value (typed). */
export type Path<T> = T extends object
  ? {
      [K in keyof T & (string | number)]:
        | `${K}`
        | (T[K] extends object ? `${K}.${Path<T[K]>}` : never);
    }[keyof T & (string | number)]
  : never;
