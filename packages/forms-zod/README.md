# @fluixi/forms-zod

Turn a [Zod](https://zod.dev) schema into `@fluixi/forms-core` validators, with errors reported by path, or build a typed form from it with `fromZod`.

## Install

```sh
npm i @fluixi/forms-zod @fluixi/reactive zod
```

## Usage

```ts
import { z } from 'zod';
import { fromZod } from '@fluixi/forms-zod';

const Signup = z.object({ email: z.email(), age: z.number().min(18) });
const form = fromZod(Signup, { email: '', age: 0 });

form.get('age').setValue(16);
form.get('age').error(); // the schema's message
```

`zodValidator(schema)` validates a whole group, `zodFieldValidator(schema)` a single field, and `zodErrorsByPath` groups a failed parse by dotted path. Zod 4 also implements Standard Schema, which `@fluixi/forms-core` accepts directly.

Part of [`@fluixi/forms`](https://www.npmjs.com/package/@fluixi/forms), reactive forms for [Fluixi](https://fluixi.com). Its README is the full guide.

## License

[MIT](https://github.com/fluixi/forms/blob/alpha/LICENSE) © Ibrahima Touré
