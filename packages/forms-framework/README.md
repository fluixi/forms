# @fluixi/forms-framework

JSX bindings for `@fluixi/forms-core`: `bindField`, `bindCheckbox`, the `<Field>` component and `use:model`.

## Install

```sh
npm i @fluixi/forms-framework @fluixi/reactive
```

## Usage

```tsx
import { Field } from '@fluixi/forms-framework';

<Field control={form.get('email')}>
  {(b, field) => (
    <>
      <input value={b.value()} onInput={b.onInput} onBlur={b.onBlur} />
      <Show when={field.touched() && field.error()}>{(e) => <span>{e().message}</span>}</Show>
    </>
  )}
</Field>
```

`bindField(field)` returns the same bindings without the component, and `<input use:model={field} />` is the directive form.

Part of [`@fluixi/forms`](https://www.npmjs.com/package/@fluixi/forms), reactive forms for [Fluixi](https://fluixi.com). Its README is the full guide.

## License

[MIT](https://github.com/fluixi/forms/blob/alpha/LICENSE) © Ibrahima Touré
