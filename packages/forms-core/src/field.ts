/**
 * createField — the FormControl equivalent.
 *
 * Reactivity model (fine-grained, no central store):
 *   value      → a signal
 *   touched    → a signal
 *   disabled   → a signal
 *   syncErrors → a memo over (value, sibling deps via ctx) — LAZY, recomputed only when
 *                an input changes, and only if something reads it.
 *   asyncErrors→ a signal, written by a debounced effect (AbortController-cancelled)
 *   errors     → memo merging sync + async
 *   valid/dirty/… → memos derived from the above
 *
 * No field re-runs because another field changed, unless it explicitly reads that field
 * through `ctx.get(path)` (a cross-field dependency) — that read subscribes it precisely.
 */
import {
  createSignal,
  createMemo,
  createEffect,
  untrack,
  onCleanup,
  batch,
} from '@fluixi/reactive/signal';
import type {
  Accessor,
  FieldControl,
  FieldOptions,
  UpdateOptions,
  ValidationError,
  ValidatorContext,
  AnyControl,
  Widen,
} from './types.js';

/** Internal hooks the parent group/array uses to wire context + propagation. */
export interface InternalControl {
  _setParent(parent: AnyControl | null, key: string | number | null): void;
  _root(): AnyControl;
  _ctxGet(path: string): unknown;
  _bumpSubmit(n: Accessor<number>): void;
}

export function createField<T>(
  initial: T,
  options: FieldOptions<T> = {},
): FieldControl<Widen<T>> {
  const equals = options.equals ?? Object.is;
  const debounce = options.debounce ?? 250;
  const syncValidators = options.validators ?? [];
  const asyncValidators = options.asyncValidators ?? [];

  const [value, setValueSig] = createSignal<T>(initial);
  const [initialValue, setInitial] = createSignal<T>(initial);
  const [touched, setTouchedSig] = createSignal(false);
  const [disabled, setDisabledSig] = createSignal(!!options.disabled);
  const [asyncErrors, setAsyncErrors] = createSignal<ValidationError[]>([]);
  const [pending, setPending] = createSignal(false);
  const [submitCount, setSubmitCount] = createSignal(0);

  // Parent wiring (set when this field is placed into a group/array).
  let parent: AnyControl | null = null;
  let self: FieldControl<T> & InternalControl;

  const ctx: ValidatorContext = {
    get control() {
      return self;
    },
    get root() {
      return self._root();
    },
    get: (path) => self._ctxGet(path) as any,
  };

  // Sync validation — a memo. Reading `value()` subscribes it to value; any `ctx.get(p)`
  // inside a validator subscribes it to that sibling. Disabled fields are always valid.
  const syncErrors = createMemo<ValidationError[]>(() => {
    if (disabled()) return [];
    const v = value();
    const out: ValidationError[] = [];
    for (const validator of syncValidators) {
      const e = validator(v, ctx);
      if (e) out.push(e);
    }
    return out;
  });

  const errors = createMemo<ValidationError[]>(() =>
    disabled() ? [] : [...syncErrors(), ...asyncErrors()],
  );
  const error = createMemo(() => errors()[0]);
  const valid = createMemo(() => !disabled() && errors().length === 0 && !pending());
  const invalid = createMemo(() => !valid());
  const dirty = createMemo(() => !equals(value(), initialValue()));
  const pristine = createMemo(() => !dirty());

  // ── Async validation engine ──────────────────────────────────────────────────
  // A single debounced effect tracks `value`. On each change it cancels the in-flight run
  // (AbortController), waits `debounce`, runs all async validators in parallel, and writes
  // the result — but only if it's still the latest run (stale guard). pending() reflects it.
  if (asyncValidators.length > 0) {
    let runId = 0;
    let controller: AbortController | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    createEffect(() => {
      const v = value(); // track
      if (untrack(disabled)) {
        setPending(false);
        setAsyncErrors([]);
        return;
      }
      const id = ++runId;
      controller?.abort();
      if (timer) clearTimeout(timer);
      setPending(true);

      timer = setTimeout(async () => {
        controller = new AbortController();
        try {
          const results = await Promise.all(
            asyncValidators.map((av) => av(v, ctx, controller!.signal)),
          );
          if (id !== runId) return; // a newer change superseded this run
          batch(() => {
            setAsyncErrors(results.filter((e): e is ValidationError => e != null));
            setPending(false);
          });
        } catch (e) {
          if (id !== runId) return;
          setPending(false);
        }
      }, debounce);
    });

    onCleanup(() => {
      controller?.abort();
      if (timer) clearTimeout(timer);
    });
  }

  // ── Mutations ────────────────────────────────────────────────────────────────
  const setValue = (v: T, opts: UpdateOptions = {}) => {
    batch(() => {
      setValueSig(() => v);
      if (!opts.pristine) setTouchedSig(true);
    });
  };

  const reset = (v?: T) => {
    batch(() => {
      const next = v === undefined ? untrack(initialValue) : v;
      if (v !== undefined) setInitial(() => v);
      setValueSig(() => next);
      setTouchedSig(false);
      setAsyncErrors([]);
      setPending(false);
    });
  };

  const validate = async (): Promise<boolean> => {
    setTouchedSig(true);
    if (asyncValidators.length === 0) return untrack(valid);
    const v = untrack(value);
    const c = new AbortController();
    setPending(true);
    try {
      const results = await Promise.all(asyncValidators.map((av) => av(v, ctx, c.signal)));
      batch(() => {
        setAsyncErrors(results.filter((e): e is ValidationError => e != null));
        setPending(false);
      });
    } catch {
      setPending(false);
    }
    return untrack(valid);
  };

  self = {
    kind: 'field',
    value,
    initialValue,
    errors,
    error,
    valid,
    invalid,
    pending,
    touched,
    untouched: createMemo(() => !touched()),
    dirty,
    pristine,
    disabled,
    enabled: createMemo(() => !disabled()),
    submitCount,

    setValue,
    patch: (v) => setValue(v as T),
    reset,
    markTouched: (t = true) => setTouchedSig(t),
    markDirty: (d = true) => {
      if (!d) setInitial(() => untrack(value)); // "not dirty" ⇒ make current the baseline
    },
    setDisabled: (d) => setDisabledSig(d),
    validate,
    dispose: () => {
      /* effects are torn down by the owning reactive root; explicit hook for manual use */
    },

    // internal
    _setParent: (p) => {
      parent = p;
    },
    _root: () => (parent ? (parent as unknown as InternalControl)._root() : self),
    _ctxGet: (path) => (parent ? (parent as unknown as InternalControl)._ctxGet(path) : undefined),
    _bumpSubmit: (n) => setSubmitCount(untrack(n)),
  };

  return self as unknown as FieldControl<Widen<T>>;
}
