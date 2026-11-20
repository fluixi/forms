# @fluixi/forms-zod

## 1.0.0-alpha.111

### Patch Changes

- @fluixi/forms-core@1.0.0-alpha.111

## 1.0.0-alpha.110

### Patch Changes

- 0d9639c: Forms packages now release with the framework at `1.0.0-alpha.110`, tested against `@fluixi/reactive@1.0.0-alpha.110`.
- Updated dependencies [0d9639c]
  - @fluixi/forms-core@1.0.0-alpha.110

## 1.0.0-alpha.109

### Patch Changes

- d37d29e: The forms packages release with the framework at `1.0.0-alpha.109` and are tested against `@fluixi/reactive@1.0.0-alpha.109`.
- Updated dependencies [d37d29e]
  - @fluixi/forms-core@1.0.0-alpha.109

## 1.0.0-alpha.100

### Patch Changes

- 917c51a: The forms packages release with the framework at 1.0.0-alpha.100, are tested against `@fluixi/reactive` 1.0.0-alpha.100, and keep the peer range unchanged (^1.0.0-alpha.99).
- Updated dependencies [917c51a]
  - @fluixi/forms-core@1.0.0-alpha.100

## 1.0.0-alpha.99

### Patch Changes

- bec5ccb: The forms packages move to the framework's version line, 1.0.0-alpha.99, and are released with it from here on; forms-core and forms-devtools peer on `@fluixi/reactive` ^1.0.0-alpha.99.
- Updated dependencies [bec5ccb]
  - @fluixi/forms-core@1.0.0-alpha.99

## 0.2.1-alpha.2

### Patch Changes

- d3d0ebe: Zod 4 schemas with issue paths as `PropertyKey[]` now fit the validators without a cast, and an issue path holding a symbol key no longer throws.
- Updated dependencies [316eb66]
  - @fluixi/forms-core@0.2.1-alpha.2

## 0.2.1-alpha.1

### Patch Changes

- Updated dependencies [a47546d]
  - @fluixi/forms-core@0.2.1-alpha.1

## 0.2.1-alpha.0

### Patch Changes

- 4ee2e58: Add a README to every package (npm showed "no README") and bundle it in the tarball.
- Updated dependencies [4ee2e58]
  - @fluixi/forms-core@0.2.1-alpha.0

## 0.2.0

### Patch Changes

- @fluixi/forms-core@0.2.0

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
- Updated dependencies [37e96af]
- Updated dependencies [c666662]
  - @fluixi/forms-core@0.1.0
