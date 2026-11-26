import { createSignal, createMemo, untrack, batch } from '@fluixi/reactive/signal';
import type {
  AnyControl,
  Control,
  ControlsRecord,
  FormControl,
  GroupControl,
  GroupOptions,
  GroupValue,
  UpdateOptions,
  ValidationError,
  ValidatorContext,
  PartialDeep,
} from './types.js';
import type { InternalControl } from './field.js';

export function createGroup<C extends ControlsRecord>(
  initialControls: C,
  options: GroupOptions<C> = {},
): GroupControl<C> {
  const [controlsSig, setControls] = createSignal<C>({ ...initialControls });
  const [disabled, setDisabledSig] = createSignal(!!options.disabled);
  const [submitCount, setSubmitCount] = createSignal(0);
  const syncValidators = options.validators ?? [];
  const asyncValidators = options.asyncValidators ?? [];

  let parent: AnyControl | null = null;
  let self: GroupControl<C> & InternalControl;

  const children = createMemo<AnyControl[]>(() => Object.values(controlsSig()));

  // Wire each child to this group (parent link) so cross-field ctx.get + root resolution work.
  const wire = (record: ControlsRecord) => {
    for (const c of Object.values(record)) (c as unknown as InternalControl)._setParent(self, null);
  };

  const value = createMemo<GroupValue<C>>(() => {
    const record = controlsSig();
    const out: any = {};
    for (const key in record) out[key] = record[key].value();
    return out;
  });

  const initialValue = createMemo<GroupValue<C>>(() => {
    const record = controlsSig();
    const out: any = {};
    for (const key in record) out[key] = record[key].initialValue();
    return out;
  });

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
      const e = validator(v as any, ctx);
      if (e) out.push(e);
    }
    return out;
  });

  // Own group-level errors plus every descendant's. As a memo, `valid()` recomputes only
  // when a child's validity flips.
  const errors = createMemo<ValidationError[]>(() => {
    if (disabled()) return [];
    const out = [...ownErrors()];
    for (const c of children()) out.push(...c.errors());
    return out;
  });

  const valid = createMemo(
    () => !disabled() && ownErrors().length === 0 && children().every((c) => c.valid()),
  );
  const pending = createMemo(() => children().some((c) => c.pending()));
  const touched = createMemo(() => children().some((c) => c.touched()));
  const dirty = createMemo(() => children().some((c) => c.dirty()));

  const patch = (partial: PartialDeep<GroupValue<C>>, opts?: UpdateOptions) => {
    batch(() => {
      const record = untrack(controlsSig);
      for (const key in partial) {
        const c = (record as any)[key] as AnyControl | undefined;
        if (c) c.patch((partial as any)[key], opts);
      }
    });
  };

  const setValue = (v: GroupValue<C>, opts?: UpdateOptions) => {
    batch(() => {
      const record = untrack(controlsSig);
      for (const key in record) record[key].setValue((v as any)[key], opts);
    });
  };

  const reset = (v?: GroupValue<C>) => {
    batch(() => {
      const record = untrack(controlsSig);
      for (const key in record) record[key].reset(v ? (v as any)[key] : undefined);
    });
  };

  const eachChild = (fn: (c: AnyControl) => void) =>
    batch(() => untrack(children).forEach(fn));

  // Resolve an absolute (root-relative) dotted path to a leaf control's reactive value.
  const ctxGet = (path: string): unknown => {
    const [head, ...rest] = path.split('.');
    const record = controlsSig();
    const child = (record as any)[head] as AnyControl | undefined;
    if (!child) return undefined;
    if (rest.length === 0) return child.value();
    return (child as unknown as InternalControl)._ctxGet(rest.join('.'));
  };

  self = {
    kind: 'group',
    get controls() {
      return untrack(controlsSig);
    },
    value,
    initialValue,
    errors,
    error: createMemo(() => errors()[0]),
    valid,
    invalid: createMemo(() => !valid()),
    pending,
    touched,
    untouched: createMemo(() => !touched()),
    dirty,
    pristine: createMemo(() => !dirty()),
    disabled,
    enabled: createMemo(() => !disabled()),
    submitCount,

    get: (key) => untrack(controlsSig)[key],
    addControl: (key, control) => {
      (control as unknown as InternalControl)._setParent(self, null);
      setControls((prev) => ({ ...prev, [key]: control }) as C);
    },
    removeControl: (key) =>
      setControls((prev) => {
        const next = { ...prev };
        delete (next as any)[key];
        return next as C;
      }),

    setValue,
    patch,
    reset,
    markTouched: (t = true) => eachChild((c) => c.markTouched(t)),
    markDirty: (d = true) => eachChild((c) => c.markDirty(d)),
    setDisabled: (d) => {
      setDisabledSig(d);
      eachChild((c) => c.setDisabled(d));
    },
    validate: async () => {
      const results = await Promise.all([
        ...untrack(children).map((c) => c.validate()),
      ]);
      return results.every(Boolean) && untrack(valid);
    },
    dispose: () => eachChild((c) => c.dispose()),

    _setParent: (p) => {
      parent = p;
    },
    _root: () => (parent ? (parent as unknown as InternalControl)._root() : self),
    _ctxGet: (path) =>
      parent ? (parent as unknown as InternalControl)._ctxGet(path) : ctxGet(path),
    _bumpSubmit: () => {
      setSubmitCount((n) => n + 1);
      eachChild((c) => (c as unknown as InternalControl)._bumpSubmit(submitCount));
    },
  };

  wire(untrack(controlsSig));
  return self;
}

/** Root form: a group plus submission state + `submit()`. */
export function createForm<C extends ControlsRecord>(
  controls: C,
  options: GroupOptions<C> = {},
): FormControl<C> {
  const group = createGroup(controls, options) as GroupControl<C> & InternalControl;
  const [submitting, setSubmitting] = createSignal(false);
  const [submitted, setSubmitted] = createSignal(false);

  const submit: FormControl<C>['submit'] = async (onValid) => {
    setSubmitted(true);
    group.markTouched(true);
    group._bumpSubmit(group.submitCount);
    const ok = await group.validate();
    if (!ok) return false;
    setSubmitting(true);
    try {
      await onValid(untrack(group.value));
      return true;
    } finally {
      setSubmitting(false);
    }
  };

  return Object.assign(group, { submitting, submitted, submit }) as FormControl<C>;
}
