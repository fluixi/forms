/**
 * createFormArray — a dynamic, ordered list of controls with STABLE identity.
 *
 * The list is a signal of controls; push/insert/remove/move replace it immutably so
 * fine-grained list diffing (the framework's keyed `<For>`) reuses DOM for moved rows
 * instead of re-rendering. Identity is the control object itself (stable across reorders),
 * exposed via `keyOf` for keyed rendering. Aggregate state is derived with memos.
 */
import { createSignal, createMemo, untrack, batch } from '@fluixi/reactive/signal';
import type {
  AnyControl,
  ArrayControl,
  ArrayOptions,
  Control,
  UpdateOptions,
  ValidationError,
  ValidatorContext,
  PartialDeep,
} from './types.js';
import type { InternalControl } from './field.js';

let _key = 0;
const keys = new WeakMap<object, number>();
/** Stable key for a control (for keyed list rendering). */
export const keyOf = (control: object): number => {
  let k = keys.get(control);
  if (k === undefined) keys.set(control, (k = ++_key));
  return k;
};

export function createFormArray<TItem, TCtrl extends Control<TItem> = Control<TItem>>(
  initial: TCtrl[] = [],
  options: ArrayOptions<TItem> = {},
): ArrayControl<TItem, TCtrl> {
  const [list, setList] = createSignal<TCtrl[]>([...initial]);
  const [disabled, setDisabledSig] = createSignal(!!options.disabled);
  const [submitCount] = createSignal(0);
  const syncValidators = options.validators ?? [];

  let parent: AnyControl | null = null;
  let self: ArrayControl<TItem, TCtrl> & InternalControl;

  const wire = (c: TCtrl) => (c as unknown as InternalControl)._setParent(self, null);

  const value = createMemo<TItem[]>(() => list().map((c) => c.value()));
  const initialValue = createMemo<TItem[]>(() => list().map((c) => c.initialValue()));

  const ctx: ValidatorContext = {
    get control() {
      return self;
    },
    get root() {
      return self._root();
    },
    get: (path) => self._ctxGet(path) as any,
  };

  const ownErrors = createMemo<ValidationError[]>(() => {
    if (disabled()) return [];
    const v = value();
    const out: ValidationError[] = [];
    for (const validator of syncValidators) {
      const e = validator(v, ctx);
      if (e) out.push(e);
    }
    return out;
  });

  const errors = createMemo<ValidationError[]>(() => {
    if (disabled()) return [];
    const out = [...ownErrors()];
    for (const c of list()) out.push(...c.errors());
    return out;
  });

  const valid = createMemo(
    () => !disabled() && ownErrors().length === 0 && list().every((c) => c.valid()),
  );

  const mutate = (fn: (arr: TCtrl[]) => TCtrl[]) =>
    setList((prev) => fn([...prev]));

  self = {
    kind: 'array',
    controls: list,
    length: createMemo(() => list().length),
    value,
    initialValue,
    errors,
    error: createMemo(() => errors()[0]),
    valid,
    invalid: createMemo(() => !valid()),
    pending: createMemo(() => list().some((c) => c.pending())),
    touched: createMemo(() => list().some((c) => c.touched())),
    untouched: createMemo(() => !list().some((c) => c.touched())),
    dirty: createMemo(() => list().some((c) => c.dirty())),
    pristine: createMemo(() => !list().some((c) => c.dirty())),
    disabled,
    enabled: createMemo(() => !disabled()),
    submitCount,

    at: (i) => untrack(list)[i],
    push: (c) => {
      wire(c);
      mutate((arr) => (arr.push(c), arr));
    },
    insert: (i, c) => {
      wire(c);
      mutate((arr) => (arr.splice(i, 0, c), arr));
    },
    removeAt: (i) => mutate((arr) => (arr.splice(i, 1), arr)),
    move: (from, to) =>
      mutate((arr) => {
        const [c] = arr.splice(from, 1);
        arr.splice(to, 0, c);
        return arr;
      }),
    clear: () => setList([]),

    setValue: (v: TItem[], opts?: UpdateOptions) =>
      batch(() => untrack(list).forEach((c, i) => c.setValue(v[i], opts))),
    patch: (v: PartialDeep<TItem[]>, opts?: UpdateOptions) =>
      batch(() => untrack(list).forEach((c, i) => (v as any)[i] != null && c.patch((v as any)[i], opts))),
    reset: (v?: TItem[]) => batch(() => untrack(list).forEach((c, i) => c.reset(v ? v[i] : undefined))),
    markTouched: (t = true) => batch(() => untrack(list).forEach((c) => c.markTouched(t))),
    markDirty: (d = true) => batch(() => untrack(list).forEach((c) => c.markDirty(d))),
    setDisabled: (d) => {
      setDisabledSig(d);
      batch(() => untrack(list).forEach((c) => c.setDisabled(d)));
    },
    validate: async () => {
      const r = await Promise.all(untrack(list).map((c) => c.validate()));
      return r.every(Boolean) && untrack(valid);
    },
    dispose: () => untrack(list).forEach((c) => c.dispose()),

    _setParent: (p) => {
      parent = p;
    },
    _root: () => (parent ? (parent as unknown as InternalControl)._root() : self),
    _ctxGet: (path) =>
      parent ? (parent as unknown as InternalControl)._ctxGet(path) : undefined,
    _bumpSubmit: () =>
      batch(() => untrack(list).forEach((c) => (c as unknown as InternalControl)._bumpSubmit(submitCount))),
  };

  initial.forEach(wire);
  return self;
}
