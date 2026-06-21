---
"@fluixi/forms-core": minor
"@fluixi/forms-framework": minor
"@fluixi/forms-zod": minor
"@fluixi/forms-valibot": minor
"@fluixi/forms-devtools": minor
---

Initial release of @fluixi/forms — reactive forms for fine-grained signal frameworks.

- **forms-core**: `createField` / `createGroup` / `createForm` / `createFormArray`, built-in
  + composed validators, debounced async validation (AbortController + stale-run guard),
  touched/dirty/pristine/pending tracking, submission state, fine-grained cross-field
  dependencies via `ctx.get(path)`.
- **forms-framework**: `bindField`, `<Field>` render-prop, `use:model` directive.
- **forms-zod** / **forms-valibot**: schema → validators, error-by-path, `fromZod` typed
  form generation.
- **forms-devtools**: untracked `snapshot` / `watch` / `flatten` inspector.
