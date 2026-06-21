/**
 * @fluixi/forms-core — reactive forms for fine-grained signal frameworks.
 *
 * Primitives:
 *   createField  — a single control (value + validation + touched/dirty/async)
 *   createGroup  — a nested record of controls (aggregate state)
 *   createForm   — a root group + submission
 *   createFormArray — a dynamic, keyed list of controls
 */
export { createField } from './field.js';
export { createGroup, createForm } from './group.js';
export { createFormArray, keyOf } from './array.js';

export * from './validators.js';
export type {
  Accessor,
  ValidationError,
  ValidatorContext,
  Validator,
  AsyncValidator,
  UpdateOptions,
  ControlKind,
  Control,
  AnyControl,
  FieldOptions,
  FieldControl,
  ControlsRecord,
  GroupValue,
  GroupOptions,
  GroupControl,
  ArrayOptions,
  ArrayControl,
  FormControl,
  PartialDeep,
  Path,
} from './types.js';
