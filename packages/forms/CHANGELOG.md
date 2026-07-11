# @fluixi/forms

## 0.2.1-alpha.0

### Patch Changes

- 4ee2e58: Add a README to every package (npm showed "no README") and bundle it in the tarball.
- Updated dependencies [4ee2e58]
  - @fluixi/forms-core@0.2.1-alpha.0
  - @fluixi/forms-framework@0.2.1-alpha.0
  - @fluixi/forms-zod@0.2.1-alpha.0
  - @fluixi/forms-valibot@0.2.1-alpha.0
  - @fluixi/forms-devtools@0.2.1-alpha.0

## 0.2.0

### Minor Changes

- 2bec026: Add `@fluixi/forms` — an umbrella package that re-exports the whole suite from one entry:

  ```ts
  import {
    createForm,
    createField,
    required,
    Field,
    fromZod,
    snapshot,
  } from "@fluixi/forms";
  ```

  Subpath entries are available for granular imports (and to avoid pulling in both schema
  adapters): `@fluixi/forms/core`, `/framework`, `/zod`, `/valibot`, `/devtools`. Marked
  `sideEffects: false` so bundlers tree-shake unused adapters.

### Patch Changes

- @fluixi/forms-core@0.2.0
- @fluixi/forms-framework@0.2.0
- @fluixi/forms-zod@0.2.0
- @fluixi/forms-valibot@0.2.0
- @fluixi/forms-devtools@0.2.0
