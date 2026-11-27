# @fluixi/forms-devtools

Inspect `@fluixi/forms-core` forms without subscribing to them: `snapshot`, `watch` and `flatten`.

## Install

```sh
npm i @fluixi/forms-devtools @fluixi/reactive
```

## Usage

```ts
import { snapshot, watch, flatten } from '@fluixi/forms-devtools';

snapshot(form);                        // the whole tree, read once
const stop = watch(form, (snap) => render(snap)); // a new snapshot on every change
flatten(form);                         // [{ path, snap }] for an inspector table
stop();
```

Reads go through `untrack`, so inspecting a form never adds a dependency to the app. `watch` adds one effect over the root.

Part of [`@fluixi/forms`](https://www.npmjs.com/package/@fluixi/forms), reactive forms for [Fluixi](https://fluixi.com). Its README is the full guide.

## License

[MIT](https://github.com/fluixi/forms/blob/alpha/LICENSE) © Ibrahima Touré
