---
"@fluixi/forms": minor
---

Add `@fluixi/forms` — an umbrella package that re-exports the whole suite from one entry:

```ts
import { createForm, createField, required, Field, fromZod, snapshot } from '@fluixi/forms';
```

Subpath entries are available for granular imports (and to avoid pulling in both schema
adapters): `@fluixi/forms/core`, `/framework`, `/zod`, `/valibot`, `/devtools`. Marked
`sideEffects: false` so bundlers tree-shake unused adapters.
