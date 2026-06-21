# @fluixi/forms-zod

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
