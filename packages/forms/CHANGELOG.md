# @fluixi/forms

## 1.0.0-alpha.100

### Patch Changes

- 917c51a: The forms packages release with the framework at 1.0.0-alpha.100, are tested against `@fluixi/reactive` 1.0.0-alpha.100, and keep the peer range unchanged (^1.0.0-alpha.99).
- Updated dependencies [917c51a]
  - @fluixi/forms-core@1.0.0-alpha.100
  - @fluixi/forms-framework@1.0.0-alpha.100
  - @fluixi/forms-zod@1.0.0-alpha.100
  - @fluixi/forms-valibot@1.0.0-alpha.100
  - @fluixi/forms-devtools@1.0.0-alpha.100

## 1.0.0-alpha.99

### Patch Changes

- bec5ccb: The forms packages move to the framework's version line, 1.0.0-alpha.99, and are released with it from here on; forms-core and forms-devtools peer on `@fluixi/reactive` ^1.0.0-alpha.99.
- Updated dependencies [bec5ccb]
  - @fluixi/forms-core@1.0.0-alpha.99
  - @fluixi/forms-framework@1.0.0-alpha.99
  - @fluixi/forms-zod@1.0.0-alpha.99
  - @fluixi/forms-valibot@1.0.0-alpha.99
  - @fluixi/forms-devtools@1.0.0-alpha.99

## 0.2.1-alpha.2

### Patch Changes

- Updated dependencies [316eb66]
- Updated dependencies [d3d0ebe]
  - @fluixi/forms-core@0.2.1-alpha.2
  - @fluixi/forms-zod@0.2.1-alpha.2
  - @fluixi/forms-devtools@0.2.1-alpha.2
  - @fluixi/forms-framework@0.2.1-alpha.2
  - @fluixi/forms-valibot@0.2.1-alpha.2

## 0.2.1-alpha.1

### Patch Changes

- Updated dependencies [a47546d]
  - @fluixi/forms-core@0.2.1-alpha.1
  - @fluixi/forms-devtools@0.2.1-alpha.1
  - @fluixi/forms-framework@0.2.1-alpha.1
  - @fluixi/forms-valibot@0.2.1-alpha.1
  - @fluixi/forms-zod@0.2.1-alpha.1

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
