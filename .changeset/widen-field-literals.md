---
"@fluixi/forms-core": patch
"@fluixi/forms-zod": patch
---

Widen fresh field literals so `createField('')` infers `FieldControl<string>` (not
`FieldControl<''>`). `T` appears contravariantly in `FieldOptions<T>`, which suppressed
TypeScript's literal-widening; `createField` now returns `FieldControl<Widen<T>>`. Pass an
explicit type argument (e.g. `createField<'a' | 'b'>('a')`) to keep a literal union.
