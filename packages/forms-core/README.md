# @fluixi/forms-core

Fields, groups, forms and arrays, with sync and async validation, built-in validators and Standard Schema support. Every field is its own reactive cell.

## Install

```sh
npm i @fluixi/forms-core @fluixi/reactive
```

## Usage

```ts
import { createForm, createField, required, email } from '@fluixi/forms-core';

const form = createForm({
  email: createField('', { validators: [required(), email()] }),
});

form.get('email').setValue('ada@example.com');
form.valid(); // true
```

Built-in validators: `required`, `requiredTrue`, `minLength`, `maxLength`, `min`, `max`, `email`, `pattern`, `sameAs`, with `when`, `compose` and `all` to combine them and `asyncCheck` for async rules. `standardValidator(schema)` takes any [Standard Schema](https://standardschema.dev) library.

Part of [`@fluixi/forms`](https://www.npmjs.com/package/@fluixi/forms), reactive forms for [Fluixi](https://fluixi.com). Its README is the full guide.

## License

[MIT](https://github.com/fluixi/forms/blob/alpha/LICENSE) © Ibrahima Touré
