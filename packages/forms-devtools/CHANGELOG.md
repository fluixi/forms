# @fluixi/forms-devtools

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

- Updated dependencies [37e96af]
- Updated dependencies [c666662]
  - @fluixi/forms-core@0.1.0
