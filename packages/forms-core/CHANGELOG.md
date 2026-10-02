# @fluixi/forms-core

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
