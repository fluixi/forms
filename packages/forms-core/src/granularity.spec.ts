// Counts validator runs: changing one field must not recompute an unrelated one, and a
// cross-field dependency recomputes only its dependent.
import { describe, it, expect } from 'vitest';
import { createForm, createField } from './index.js';

describe('granularity', () => {
  it('changing field A does not recompute field B', () => {
    let aRuns = 0;
    let bRuns = 0;
    const form = createForm({
      a: createField('', { validators: [() => (aRuns++, null)] }),
      b: createField('', { validators: [() => (bRuns++, null)] }),
    });

    // Prime both memos.
    form.get('a').valid();
    form.get('b').valid();
    const a0 = aRuns;
    const b0 = bRuns;

    // Mutate A, then re-read both.
    form.get('a').setValue('x');
    form.get('a').valid(); // A recomputes (its value changed)
    form.get('b').valid(); // B is cached and must not recompute

    expect(aRuns).toBeGreaterThan(a0);
    expect(bRuns).toBe(b0); // ← fine-grained: B untouched
  });

  it('reading group.valid() recomputes only when a CHILD flips', () => {
    let aRuns = 0;
    const form = createForm({
      a: createField('ok', { validators: [(v) => (aRuns++, v ? null : { type: 'required' })] }),
      b: createField('ok'),
    });
    form.valid(); // prime aggregate + a's memo
    const a0 = aRuns;

    // Mutating b (no validators) should not re-run a's validator.
    form.get('b').setValue('changed');
    form.valid();
    expect(aRuns).toBe(a0);

    // Mutating a re-runs a's validator (and the aggregate).
    form.get('a').setValue('');
    form.valid();
    expect(aRuns).toBeGreaterThan(a0);
    expect(form.valid()).toBe(false);
  });

  it('a cross-field dependency recomputes only the dependent', () => {
    let pwRuns = 0;
    let confirmRuns = 0;
    const form = createForm({
      pw: createField('a', { validators: [() => (pwRuns++, null)] }),
      confirm: createField('a', {
        validators: [
          (v, ctx) => (confirmRuns++, v === ctx.get('pw') ? null : { type: 'mismatch' }),
        ],
      }),
    });
    form.get('pw').valid();
    form.get('confirm').valid();
    const pw0 = pwRuns;
    const confirm0 = confirmRuns;

    // Change pw → confirm depends on it (ctx.get('pw')) and must recompute; pw recomputes
    // its own validator too, but nothing else in a larger form would.
    form.get('pw').setValue('b');
    form.get('confirm').valid();
    form.get('pw').valid();

    expect(confirmRuns).toBeGreaterThan(confirm0); // dependent recomputed
    expect(pwRuns).toBeGreaterThan(pw0); // pw's own validator recomputed (value changed)
    expect(form.get('confirm').valid()).toBe(false); // 'a' !== 'b'
  });

  it('scales: mutating 1 of 1000 fields recomputes exactly 1 validator', () => {
    const counters: number[] = [];
    const controls: Record<string, any> = {};
    for (let i = 0; i < 1000; i++) {
      counters[i] = 0;
      controls[`f${i}`] = createField('', { validators: [() => (counters[i]++, null)] });
    }
    const form = createForm(controls);
    // Prime all.
    for (let i = 0; i < 1000; i++) form.get(`f${i}`).valid();
    const snapshot = [...counters];

    form.get('f500').setValue('changed');
    for (let i = 0; i < 1000; i++) form.get(`f${i}`).valid();

    let recomputed = 0;
    for (let i = 0; i < 1000; i++) if (counters[i] > snapshot[i]) recomputed++;
    expect(recomputed).toBe(1); // ← only f500
  });
});
