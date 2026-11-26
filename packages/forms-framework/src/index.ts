import type { FieldControl } from '@fluixi/forms-core';

export interface FieldBinding<T> {
  /** Reactive value accessor, passed as `value={binding.value}`. */
  value: () => T;
  /** Writes the field and marks it touched. */
  onInput: (e: { currentTarget: { value: any } } | any) => void;
  onBlur: () => void;
  'aria-invalid': () => boolean;
  disabled: () => boolean;
}

/** Bind a field to a native input. `coerce` turns the DOM string into T (number, etc.). */
export function bindField<T>(field: FieldControl<T>, coerce?: (raw: string) => T): FieldBinding<T> {
  return {
    value: field.value,
    onInput: (e: any) => {
      const raw = e?.currentTarget?.value ?? e?.target?.value ?? e;
      field.setValue((coerce ? coerce(raw) : raw) as T);
    },
    onBlur: () => field.markTouched(true),
    'aria-invalid': () => field.invalid() && field.touched(),
    disabled: field.disabled,
  };
}

/** Bind a checkbox (boolean field). */
export function bindCheckbox(field: FieldControl<boolean>) {
  return {
    checked: field.value,
    onChange: (e: any) => field.setValue(!!(e?.currentTarget?.checked ?? e?.target?.checked)),
    onBlur: () => field.markTouched(true),
  };
}

/**
 * `<Field>` render-prop component. Usage (Fluixi JSX):
 *   <Field control={form.get('email')}>
 *     {(b, field) => <>
 *       <input value={b.value()} onInput={b.onInput} onBlur={b.onBlur} />
 *       <Show when={field.touched() && field.error()}>{e => <span>{e().message}</span>}</Show>
 *     </>}
 *   </Field>
 */
export function Field<T>(props: {
  control: FieldControl<T>;
  children: (binding: FieldBinding<T>, field: FieldControl<T>) => any;
  coerce?: (raw: string) => T;
}): any {
  return props.children(bindField(props.control, props.coerce), props.control);
}

/**
 * Directive-style binding for the compiler's `use:` syntax:
 *   <input use:model={field} />
 * Wires value + input + blur on the element, with cleanup.
 */
export function model<T>(el: HTMLInputElement, accessor: () => FieldControl<T>): void {
  const field = accessor();
  const sync = () => {
    const v = field.value() as any;
    if (el.type === 'checkbox') el.checked = !!v;
    else if (el.value !== String(v ?? '')) el.value = String(v ?? '');
  };
  // A render-effect would normally be created by the framework around use: directives;
  // here we attach listeners + an initial sync. (The host framework owns the effect.)
  sync();
  const onInput = () =>
    field.setValue((el.type === 'checkbox' ? el.checked : el.value) as T);
  const onBlur = () => field.markTouched(true);
  el.addEventListener('input', onInput);
  el.addEventListener('blur', onBlur);
}
