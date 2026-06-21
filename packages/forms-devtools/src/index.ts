/**
 * @fluixi/forms-devtools — inspect a form tree without subscribing to it.
 *
 * `snapshot()` reads the current state via `untrack` (no subscriptions created), so calling
 * it from a devtools panel never perturbs the reactive graph. `watch()` creates ONE effect
 * over the root that emits a fresh snapshot on any change — the only subscription devtools adds.
 */
import { untrack, createEffect } from '@fluixi/reactive/signal';
import type { AnyControl, ValidationError } from '@fluixi/forms-core';

export interface ControlSnapshot {
  kind: string;
  value: unknown;
  valid: boolean;
  dirty: boolean;
  touched: boolean;
  pending: boolean;
  disabled: boolean;
  errors: ValidationError[];
  children?: Record<string, ControlSnapshot> | ControlSnapshot[];
}

/** Read the full tree state once, without creating subscriptions. */
export function snapshot(control: AnyControl): ControlSnapshot {
  return untrack(() => {
    const base: ControlSnapshot = {
      kind: control.kind,
      value: control.value(),
      valid: control.valid(),
      dirty: control.dirty(),
      touched: control.touched(),
      pending: control.pending(),
      disabled: control.disabled(),
      errors: control.errors(),
    };
    if (control.kind === 'group') {
      const controls = (control as any).controls as Record<string, AnyControl>;
      base.children = Object.fromEntries(
        Object.entries(controls).map(([k, c]) => [k, snapshot(c)]),
      );
    } else if (control.kind === 'array') {
      base.children = (control as any).controls().map((c: AnyControl) => snapshot(c));
    }
    return base;
  });
}

/** Subscribe to the tree — `cb` fires with a new snapshot on any change. Returns a disposer. */
export function watch(control: AnyControl, cb: (snap: ControlSnapshot) => void): () => void {
  let dispose = () => {};
  createEffect(() => {
    // Touch the aggregate accessors so this effect tracks the whole subtree, then snapshot.
    control.value();
    control.errors();
    control.pending();
    cb(snapshot(control));
  });
  return dispose;
}

/** Flatten the tree to a list of `{ path, snapshot }` for a table/inspector view. */
export function flatten(control: AnyControl, path = ''): { path: string; snap: ControlSnapshot }[] {
  const snap = snapshot(control);
  const rows = [{ path: path || '(root)', snap }];
  if (snap.children && !Array.isArray(snap.children)) {
    for (const [k, child] of Object.entries(snap.children)) {
      rows.push({ path: path ? `${path}.${k}` : k, snap: child });
    }
  }
  return rows;
}
