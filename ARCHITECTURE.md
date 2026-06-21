# @fluixi/forms — Architecture

Angular Reactive Forms, redesigned natively for a fine-grained, compiler-driven reactive
framework. **No RxJS, no central store, no
VDOM, no proxy runtime.** Every field is an independent reactive cell; validation and
aggregate state are lazy memos; updates propagate through the signal graph, not a
broadcast bus.

---

## 1. Layered architecture / folder structure

```
libs/forms/
  packages/
    forms-core/        # primitives: createField / createGroup / createForm / createFormArray
      src/{types,validators,field,group,array,index}.ts
    forms-framework/   # JSX bindings: bindField, <Field>, use:model directive
    forms-zod/         # Zod schema → validators (typed, error-by-path)
    forms-valibot/     # Valibot schema → validators
    forms-devtools/    # untracked snapshot, watch(), flatten() for an inspector
```

Dependency direction: `framework / zod / valibot / devtools → forms-core → @fluixi/reactive`.
Only `forms-core` and `forms-devtools` touch the reactive runtime; adapters are pure.

## 2. Internal data model

A **control** is a closure over signals + memos — never a plain object snapshot. Three kinds
share one `Control<T>` shape (`types.ts`):

| Primitive            | Owns (signals)                                   | Derives (memos)                                  |
|----------------------|--------------------------------------------------|--------------------------------------------------|
| `createField`        | value, touched, disabled, asyncErrors, pending   | syncErrors, errors, valid, dirty, pristine       |
| `createGroup`/`Form` | controls (structure), disabled, submitCount      | value, errors (aggregate), valid, dirty, pending |
| `createFormArray`    | list (ordered controls), disabled                | value, errors (aggregate), valid, length         |

Parent links are set on registration (`_setParent`), giving every control `_root()` and
`_ctxGet(path)` for cross-field reads. The tree is a graph of cells; there is **no** mutable
global form object that everything writes to.

## 3. Reactivity flow

```
setValue(v) ──► value signal ──► syncErrors memo ──► errors memo ──► valid memo
                      │                                      └────► dirty memo
                      └──► (async effect, debounced) ──► asyncErrors signal ──► errors ──► valid
group.valid = memo(children.every(c => c.valid()))   # recomputes only when a child flips
```

- **Reading** `field.valid()` subscribes the caller to exactly that memo. A keystroke in
  field A re-runs A's `errors`/`valid` and any memo that *read* A (e.g. `group.valid`), and
  nothing else.
- **Cross-field**: a validator calling `ctx.get('password')` resolves the path to the
  *password field's value signal* and subscribes precisely to it — so `confirm` recomputes
  when `password` changes, with no manual subscription/teardown.
- **Batching**: every mutation wraps `batch()`, so a `patchValue` over 50 fields produces
  one propagation pass, not 50.

## 4. Validation engine (sync)

`syncErrors` is a memo that runs the validator array over `value()` (and disabled short-
circuits to valid). Lazy: it only runs when read AND an input changed. Validators are pure
`(value, ctx) => error | null`; `compose` short-circuits, `all` collects, `when` makes a
validator conditional on sibling state — all just function composition, no engine objects.

## 5. Async validation engine

One debounced `createEffect` per field tracks `value`. On change it: cancels the in-flight
run (`AbortController`), waits `debounce` ms, runs all async validators in parallel, and —
guarded by a monotonic `runId` (stale-result rejection) — writes `asyncErrors` + clears
`pending` in a `batch`. `valid` stays `false` while `pending`. `validate()` forces an
immediate run for submit. Cleanup aborts + clears the timer via `onCleanup`.

## 6. FormArray (dynamic, keyed)

The list is a signal of controls; `push/insert/removeAt/move/clear` replace it immutably.
**Identity is the control object** (stable across reorders) → `keyOf(control)` feeds the
framework's keyed `<For>`, so moving row 5→1 moves the DOM node instead of re-rendering
five rows. Aggregate `value`/`valid` are memos over the list.

## 7. Nested forms

`createGroup` composes other groups/arrays/fields uniformly (`Control<T>` is the only
contract). Aggregation recurses through `children()`; `value`/`initialValue` build the deep
object/array; `errors()` flattens descendants (each carrying `meta.path`). `addControl`/
`removeControl` mutate the structure signal → conditional fields are just runtime
add/remove, fully reactive.

## 8. TypeScript types

- `GroupValue<C>` infers `{ [K]: ValueOf<C[K]> }` from the controls record → `form.value()`
  is fully typed.
- `PartialDeep<T>` types `patchValue`.
- `Path<T>` gives dotted autocomplete for `ctx.get` / typed paths.
- Schema adapters infer the value type from `z.infer` / valibot output, so a schema-driven
  form is end-to-end typed with zero manual annotation.

## 9. JSX integration (`forms-framework`)

`bindField(field)` returns *accessors* (`value`, `onInput`, `onBlur`, `aria-invalid`) — in
the compiler `value={b.value}` wires to one signal. `<Field control={...}>{(b, f) => …}</Field>`
is a render-prop; `use:model={field}` is the directive form. Error display uses `<Show
when={f.touched() && f.error()}>` — granular, no form-wide re-render.

## 10. Compiler integration (opportunities)

The Fluixi Babel/IR compiler can specialize forms (all optional, runtime works without them):

- **Automatic field binding** — transform `use:model={field}` into the inlined
  value/input/blur wiring (skip the generic `model()` indirection).
- **Validation memo hoisting** — a field with only static validators (`required()`,
  `minLength(3)`) has its `syncErrors` validator array hoisted to module scope (no per-
  instance closure allocation).
- **Compile-time dependency extraction** — statically resolve `ctx.get('password')` literals
  to direct signal references, eliminating the runtime path-walk.
- **Dead reactive-path elimination** — if a field's `pending`/`async` is never read and it
  has no async validators, drop the async effect entirely (tree-shake the engine).

Architecture: a `@fluixi/forms-babel` plugin visits `createField`/`bindField`/`use:model`
call sites, reads the (statically-known) validator + path args from the AST, and rewrites
them. It is a *layer* over the runtime, never a replacement.

## 11. Performance strategy & complexity

| Operation                    | Cost                                                              |
|------------------------------|------------------------------------------------------------------|
| Type a char in a field       | O(validators of that field) + O(memos that read it). Not O(N).   |
| `group.valid()` after change | O(1) amortized — `every` short-circuits at the first invalid child; the memo only re-runs when a *child's* `valid` flips. |
| `patchValue` over k fields   | O(k), single `batch` propagation.                                |
| Array move/insert/remove     | O(1) structural; keyed render reuses DOM.                        |
| Render a 5000-field form     | 5000 independent cells; idle cost ≈ 0 (memos are lazy, unread = uncomputed). |

**Memory**: per field ≈ a handful of signals/memos (no per-field store object, no proxy).
Validators with static args are hoisted (compiler) to one shared closure. Async effects
exist only on fields that declare async validators.

**Update propagation**: pull-based + lazy. A write marks dependents stale; a memo recomputes
only when read. Aggregates short-circuit. No cascading re-render, no central diff.

## 12. Devtools architecture

`snapshot(control)` reads the whole tree inside `untrack` → **zero subscriptions added**, so
the panel can poll without perturbing the graph. `watch(control, cb)` creates exactly ONE
effect (touching the root's aggregate accessors) that emits a fresh snapshot on any change.
`flatten()` produces `{ path, snap }` rows for a table; the same data feeds a validation
graph + dependency graph view (edges = `ctx.get` paths). Update tracing: wrap a field's
`setValue` to log `(path, old, new, Δerrors)`.

## 13–20 — see README for examples, roadmap, testing/benchmark strategy, and the
comparison with Angular / SolidJS / React Hook Form.
