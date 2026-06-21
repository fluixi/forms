/**
 * @fluixi/forms — umbrella package.
 *
 * Re-exports the whole @fluixi/forms-* suite from a single entry point. There are no name
 * collisions across the packages, so everything is flat:
 *
 *   import { createForm, createField, required, Field, fromZod, snapshot } from '@fluixi/forms';
 *
 * Prefer the subpath entries when you want to pull in only one piece (and avoid installing
 * both schema adapters):
 *
 *   import { createForm } from '@fluixi/forms/core';
 *   import { Field }      from '@fluixi/forms/framework';
 *   import { fromZod }    from '@fluixi/forms/zod';
 *   import { valibotValidator } from '@fluixi/forms/valibot';
 *   import { snapshot }   from '@fluixi/forms/devtools';
 *
 * Tree-shaking: `sideEffects: false` lets bundlers drop the adapters you don't import.
 */
export * from '@fluixi/forms-core';
export * from '@fluixi/forms-framework';
export * from '@fluixi/forms-zod';
export * from '@fluixi/forms-valibot';
export * from '@fluixi/forms-devtools';
