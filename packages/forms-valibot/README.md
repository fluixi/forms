# @fluixi/forms-valibot

Turn a [Valibot](https://valibot.dev) schema into `@fluixi/forms-core` validators, with errors reported by path.

## Install

```sh
npm i @fluixi/forms-valibot @fluixi/reactive valibot
```

## Usage

```ts
import * as v from 'valibot';
import { createForm, createField } from '@fluixi/forms-core';
import { valibotValidator } from '@fluixi/forms-valibot';

const Signup = v.object({ email: v.pipe(v.string(), v.email()) });

const form = createForm(
  { email: createField('') },
  { validators: [valibotValidator(v.safeParse, Signup)] },
);
```

The validator takes Valibot's `safeParse` as an argument, so this package does not import Valibot itself. `valibotErrorsByPath` groups a failed parse by dotted path.

Part of [`@fluixi/forms`](https://www.npmjs.com/package/@fluixi/forms), reactive forms for [Fluixi](https://fluixi.com). Its README is the full guide.

## License

[MIT](https://github.com/fluixi/forms/blob/alpha/LICENSE) © Ibrahima Touré
