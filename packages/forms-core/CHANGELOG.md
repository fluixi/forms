# @fluixi/forms-core

## 1.0.0-alpha.114

### Patch Changes

- 3378279: The READMEs now include peer installation instructions, a usage example for each package, and credit the license holder Ibrahima Touré.

## 1.0.0-alpha.113

### Patch Changes

- 2c10761: Forms core now builds and tests against `@fluixi/reactive` 1.0.0-alpha.114.

## 1.0.0-alpha.112

### Patch Changes

- 8a67d5f: Forms core now builds and tests against `@fluixi/reactive` 1.0.0-alpha.113.

## 1.0.0-alpha.111

## 1.0.0-alpha.110

### Patch Changes

- 0d9639c: Forms packages now release with the framework at `1.0.0-alpha.110`, tested against `@fluixi/reactive@1.0.0-alpha.110`.

## 1.0.0-alpha.109

### Patch Changes

- d37d29e: The forms packages release with the framework at `1.0.0-alpha.109` and are tested against `@fluixi/reactive@1.0.0-alpha.109`.

## 1.0.0-alpha.100

### Patch Changes

- 917c51a: The forms packages release with the framework at 1.0.0-alpha.100, are tested against `@fluixi/reactive` 1.0.0-alpha.100, and keep the peer range unchanged (^1.0.0-alpha.99).

## 1.0.0-alpha.99

### Patch Changes

- bec5ccb: The forms packages move to the framework's version line, 1.0.0-alpha.99, and are released with it from here on; forms-core and forms-devtools peer on `@fluixi/reactive` ^1.0.0-alpha.99.

## 0.2.1-alpha.2

### Patch Changes

- 316eb66: standardValidator, standardAsyncValidator and standardErrorsByPath now validate with any Standard Schema, allowing Zod 4, Valibot and ArkType schemas to plug into a field or form without a library-specific adapter.

## 0.2.1-alpha.1

### Patch Changes

- a47546d: `createFormArray` gains `pushValue`/`insertValue` and a `control` factory option.
  The array holds child controls, so adding a plain value previously meant
  `push(createField(value))` — and passing a bare object threw a cryptic
  `_setParent is not a function`. `pushValue(value)`/`insertValue(i, value)` now wrap
  the value automatically: with `createField` by default, or via a `control` factory
  (`{ control: (v) => createGroup({...}) }`) for structured rows.

## 0.2.1-alpha.0

### Patch Changes

- 4ee2e58: Add a README to every package (npm showed "no README") and bundle it in the tarball.

## 0.2.0

## 0.1.0

### Minor Changes

- 37e96af: Initial release of @fluixi/forms — reactive forms for fine-grained signal frameworks.

  - **forms-core**: `createField` / `createGroup` / `createForm` / `createFormArray`, built-in
    - composed validators, debounced async validation (AbortController + stale-run guard),
      touched/dirty/pristine/pending tracking, submission state, fine-grained cross-field
      dependencies via `ctx.get(path)`.
  - **forms-framework**: `bindField`, `<Field>` render-prop, `use:model` directive.
  - **forms-zod** / **forms-valibot**: schema → validators, error-by-path, `fromZod` typed
    form generation.
  - **forms-devtools**: untracked `snapshot` / `watch` / `flatten` inspector.

### Patch Changes

- c666662: Widen fresh field literals so `createField('')` infers `FieldControl<string>` (not
  `FieldControl<''>`). `T` appears contravariantly in `FieldOptions<T>`, which suppressed
  TypeScript's literal-widening; `createField` now returns `FieldControl<Widen<T>>`. Pass an
  explicit type argument (e.g. `createField<'a' | 'b'>('a')`) to keep a literal union.
