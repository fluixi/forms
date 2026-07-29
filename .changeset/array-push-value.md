---
"@fluixi/forms-core": patch
---

`createFormArray` gains `pushValue`/`insertValue` and a `control` factory option.
The array holds child controls, so adding a plain value previously meant
`push(createField(value))` — and passing a bare object threw a cryptic
`_setParent is not a function`. `pushValue(value)`/`insertValue(i, value)` now wrap
the value automatically: with `createField` by default, or via a `control` factory
(`{ control: (v) => createGroup({...}) }`) for structured rows.
