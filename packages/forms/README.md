# @fluixi/forms

[![npm](https://img.shields.io/npm/v/@fluixi/forms/alpha?color=0f9f87&label=npm)](https://www.npmjs.com/package/@fluixi/forms)
[![MIT license](https://img.shields.io/badge/license-MIT-4d7c0f)](https://github.com/fluixi/forms/blob/alpha/LICENSE)

Reactive forms for [Fluixi](https://fluixi.com). Every field is its own reactive cell: typing in one field re-runs that field's validators and whatever reads it, nothing else. Sync and async validation, nested groups, keyed arrays, and schema validation through Standard Schema, Zod or Valibot.

> [!NOTE]
> @fluixi/forms is in alpha. APIs can change between releases, so pin exact versions.

## Install

```sh
npm i @fluixi/forms @fluixi/reactive
```

Zod and Valibot are optional: install the one you validate with.

## Quick start

```ts
import { createForm, createField, required, email, minLength, sameAs } from '@fluixi/forms';

const form = createForm({
  name: createField('', { validators: [required(), minLength(2)] }),
  email: createField('', { validators: [required(), email()] }),
  password: createField(''),
  confirm: createField('', { validators: [sameAs('password', 'Passwords must match')] }),
});

form.get('email').value(); // ''
form.get('email').valid(); // false
form.get('email').error(); // { type: 'required', message: 'This field is required' }
form.valid();              // every field valid

form.get('email').setValue('ada@example.com');

// Validates, async validators included, then calls the handler when the form is valid.
const ok = await form.submit((values) => api.signup(values));
```

Each read is an accessor and subscribes to that value alone. `form.valid()` recomputes when a field's validity flips, not on every keystroke.

## Async validation

```ts
const username = createField('', {
  debounce: 300,
  asyncValidators: [
    async (value, _ctx, signal) => {
      const res = await fetch(`/check?u=${value}`, { signal });
      return (await res.json()).available ? null : { type: 'taken', message: 'Already taken' };
    },
  ],
});

username.pending(); // true while the check runs
```

A new value aborts the run in flight through `signal`, and a stale result is discarded. The field stays invalid while it is pending.

## Cross-field rules

A validator reads other fields through `ctx.get(path)`, which subscribes it to that field alone. `sameAs` above is built this way: `confirm` revalidates when `password` changes, with no subscription to manage.

```ts
const notOwnEmail = (value: string, ctx) =>
  value === ctx.get('email') ? { type: 'same', message: 'Pick another address' } : null;
```

`when(predicate, validator)` applies a validator only while a condition on other fields holds.

## Arrays

```ts
import { createFormArray, createField, keyOf } from '@fluixi/forms';

const tags = createFormArray([createField('a'), createField('b')]);
tags.pushValue('');
tags.move(0, 2);
tags.value(); // ['b', '', 'a']
```

Push, insert, remove and move replace the list rather than mutate it. Render it with a keyed `<For>` and `keyOf(control)`: moved rows keep their DOM nodes and focus. For rows of several fields, pass a `control` factory: `createFormArray([], { control: (row) => createGroup({ ... }) })`.

## Schemas

Any [Standard Schema](https://standardschema.dev) library works without an adapter:

```ts
import { createForm, createField, standardValidator } from '@fluixi/forms';
import * as z from 'zod';

const Signup = z.object({ email: z.email(), age: z.number().min(18) });

const form = createForm(
  { email: createField(''), age: createField(0) },
  { validators: [standardValidator(Signup)] },
);
```

Errors carry `meta.path`, so a form-level schema still reports each error on its field.

The Zod and Valibot packages add a few helpers:

- `fromZod(schema, initial)` builds a typed form from an object schema, one field per key.
- `zodErrorsByPath` and `valibotErrorsByPath` group errors by dotted path.
- `valibotValidator(safeParse, schema)` takes Valibot's `safeParse`, so the package does not import Valibot itself.

## JSX

```tsx
import { Field } from '@fluixi/forms';

<Field control={form.get('email')}>
  {(b, field) => (
    <label>
      Email
      <input value={b.value()} onInput={b.onInput} onBlur={b.onBlur} aria-invalid={b['aria-invalid']()} />
      <Show when={field.touched() && field.error()}>{(e) => <span>{e().message}</span>}</Show>
    </label>
  )}
</Field>
```

`bindField(field)` returns the same bindings without the component, `bindCheckbox` binds a boolean field, and `use:model={field}` is the directive form. With [fluixi-ui](https://ui.fluixi.com), use its `Form` and `FormField` components.

## Devtools

`snapshot(control)` reads the whole tree without subscribing to it. `watch(control, cb)` calls `cb` with a new snapshot on every change, and `flatten(control)` lists every control with its path for an inspector table.

## How it works

A control is a set of signals and memos, never a snapshot object:

| Control | Holds | Derives |
| --- | --- | --- |
| `createField` | value, touched, disabled, async errors, pending | sync errors, errors, valid, dirty |
| `createGroup`, `createForm` | its controls, disabled, submit count | value, errors, valid, dirty, pending |
| `createFormArray` | the ordered list, disabled | value, errors, valid, length |

- Validation is a memo. It runs when it is read and one of its inputs changed, so a 5,000-field form costs nothing while idle.
- Each field with async validators gets one debounced effect. Fields without them get none.
- Every mutation is batched: `patch` over fifty fields propagates once.

## Packages

`@fluixi/forms` re-exports everything below. Import a subpath, such as `@fluixi/forms/core` or `@fluixi/forms/zod`, to take one piece.

| Package | |
| --- | --- |
| [`@fluixi/forms-core`](https://github.com/fluixi/forms/tree/alpha/packages/forms-core) | Fields, groups, forms, arrays, validators and Standard Schema support. |
| [`@fluixi/forms-framework`](https://github.com/fluixi/forms/tree/alpha/packages/forms-framework) | JSX bindings: `bindField`, `<Field>`, `use:model`. |
| [`@fluixi/forms-zod`](https://github.com/fluixi/forms/tree/alpha/packages/forms-zod) | Zod validators and `fromZod`. |
| [`@fluixi/forms-valibot`](https://github.com/fluixi/forms/tree/alpha/packages/forms-valibot) | Valibot validators. |
| [`@fluixi/forms-devtools`](https://github.com/fluixi/forms/tree/alpha/packages/forms-devtools) | Snapshots and change feeds for inspectors. |

## Contributing

```sh
pnpm install
pnpm build
pnpm test
pnpm typecheck
```

Add a changeset with `pnpm changeset` for any change to a published package. See the [contributing guide](https://github.com/fluixi/.github/blob/main/CONTRIBUTING.md).

## License

[MIT](https://github.com/fluixi/forms/blob/alpha/LICENSE) © Ibrahima Touré
