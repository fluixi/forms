---
"@fluixi/forms-core": patch
---

standardValidator, standardAsyncValidator and standardErrorsByPath now validate with any Standard Schema, allowing Zod 4, Valibot and ArkType schemas to plug into a field or form without a library-specific adapter.
