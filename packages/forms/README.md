# @fluixi/forms

Reactive forms for fine-grained signal frameworks — Angular Reactive Forms redesigned
natively for a Fluixi compiler-driven runtime. No RxJS, no central store, no
proxies. Every field is an independent reactive cell.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full design.

## Packages

| Package | What |
| --- | --- |
| [`@fluixi/forms-core`](packages/forms-core) | `createField` / `createGroup` / `createForm` / `createFormArray`, validators, async engine |
| [`@fluixi/forms-framework`](packages/forms-framework) | JSX bindings — `bindField`, `<Field>`, `use:model` |
| [`@fluixi/forms-zod`](packages/forms-zod) | Zod schema → validators (typed, error-by-path) |
| [`@fluixi/forms-valibot`](packages/forms-valibot) | Valibot schema → validators |
| [`@fluixi/forms-devtools`](packages/forms-devtools) | untracked tree inspector + `watch()` |

## Quick start

```ts
import { createForm, createField, required, email, minLength, sameAs } from '@fluixi/forms-core';

const form = createForm({
  name: createField('', { validators: [required(), minLength(2)] }),
  email: createField('', { validators: [required(), email()] }),
  password: createField(''),
  confirm: createField('', { validators: [sameAs('password', 'Passwords must match')] }),
});

// fine-grained reads — subscribe to exactly what you touch
form.get('email').value();    // ''
form.get('email').valid();    // false
form.get('email').error();    // { type: 'required', message: '…' }
form.valid();                 // aggregate

form.get('email').setValue('ada@example.com');

await form.submit((values) => api.signup(values)); // validates (sync+async), returns boolean
```

### Async validation

```ts
const username = createField('', {
  debounce: 300,
  asyncValidators: [
    async (v, _ctx, signal) =>
      (await fetch(`/check?u=${v}`, { signal }).then(r => r.json())).available
        ? null : { type: 'taken', message: 'Already taken' },
  ],
});
username.pending(); // true while checking
```

### Dynamic arrays

```ts
import { createFormArray, keyOf } from '@fluixi/forms-core';

const rows = createFormArray([createField('a'), createField('b')]);
rows.push(createField(''));
rows.move(0, 2);
rows.value(); // ['b', '', 'a']
```

### Schema-driven (Zod)

```ts
import { z } from 'zod';
import { createForm, createField } from '@fluixi/forms-core';
import { zodValidator } from '@fluixi/forms-zod';

const Schema = z.object({ email: z.string().email(), age: z.number().min(18) });
const form = createForm(
  { email: createField(''), age: createField(0) },
  { validators: [zodValidator(Schema)] }, // group-level; errors routed by meta.path
);
```

### JSX (Fluixi)

```tsx
import { Field, bindField } from '@fluixi/forms-framework';

<Field control={form.get('email')}>
  {(b, f) => (
    <label>
      <input value={b.value()} onInput={b.onInput} onBlur={b.onBlur} aria-invalid={b['aria-invalid']()} />
      <Show when={f.touched() && f.error()}>{e => <span class="err">{e().message}</span>}</Show>
    </label>
  )}
</Field>
```

## Implementation roadmap

1. **forms-core** — primitives + sync/async validation + array/group. ✅ (working, 7 tests)
2. **forms-framework** — `bindField`/`<Field>`/`use:model`. ✅ scaffolded
3. **forms-zod / forms-valibot** — schema → validators + typed inference. ✅ scaffolded
4. **forms-devtools** — snapshot/watch/flatten. ✅ scaffolded
5. Schema-to-form *generation* (`fromZod(schema)` → a typed `createForm`).
6. `@fluixi/forms-babel` compiler plugin (binding/validator/dependency optimizations).
7. Field-level error routing helper (map group `zodErrorsByPath` onto child fields).
8. Devtools UI panel + dependency/validation graph rendering.

## Testing strategy

- **Unit (vitest)** — each primitive: value/validity/touched/dirty, reset, cross-field,
  async pending→resolve, array ops, submit gating. (`forms-core/src/forms.spec.ts`.)
- **Reactivity assertions** — count memo executions to prove a keystroke in field A does NOT
  recompute field B (granularity guarantee).
- **Adapter conformance** — schema validators produce the same errors as the schema lib.
- **Integration (jsdom)** — `<Field>` wiring: input → value, blur → touched, no cross-field
  re-render.

## Benchmark strategy

- **Throughput** — N independent fields; measure ms to mutate one (target: flat vs N).
- **Wide patch** — `patchValue` over k fields; assert one propagation pass (batch).
- **Array churn** — 1000-row array push/move/remove; measure DOM ops with keyed render.
- **Memory** — heap per field at N = 1k/10k. Compare with/without compiler hoisting.
- Baselines: Angular Reactive Forms, React Hook Form, Formik, SolidJS `createStore` forms.

## Comparison

| | Angular RF | React Hook Form | SolidJS (store) | **@fluixi/forms** |
| --- | --- | --- | --- | --- |
| Reactivity | RxJS Observables | re-render + refs | store proxy | **fine-grained signals** |
| Per-field updates | coarse (valueChanges) | uncontrolled/refs | proxy-path | **independent memos** |
| Re-render model | zone.js CD | minimize re-renders | granular | **no re-render — pull/lazy** |
| Async validation | AsyncValidator + RxJS | manual | manual | **debounced effect + AbortController** |
| Cross-field deps | manual subscribe | watch() | effect | **ctx.get path → precise subscription** |
| Schema | — | resolver (zod/yup) | — | **zod/valibot adapters, typed** |
| Type safety | partial | good | good | **GroupValue/PartialDeep/Path inference** |
| Big forms (10k) | heavy (CD) | good | good | **idle ≈ 0 (lazy memos)** |
```
