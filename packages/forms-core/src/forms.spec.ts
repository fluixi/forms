import { describe, it, expect } from 'vitest';
import { flush } from '@fluixi/reactive/signal';
import { createField, createForm, createFormArray, createGroup } from './index.js';
import { required, email, minLength, sameAs } from './validators.js';

const tick = async (ms = 0) => { await new Promise((r) => setTimeout(r, ms)); await flush(); };

describe('createField', () => {
  it('tracks value, validity, touched, dirty', () => {
    const f = createField('', { validators: [required(), minLength(3)] });
    expect(f.value()).toBe('');
    expect(f.valid()).toBe(false);
    expect(f.error()?.type).toBe('required');
    expect(f.touched()).toBe(false);
    expect(f.pristine()).toBe(true);

    f.setValue('ab');
    expect(f.error()?.type).toBe('minLength');
    expect(f.dirty()).toBe(true);
    expect(f.touched()).toBe(true);

    f.setValue('abc');
    expect(f.valid()).toBe(true);
    expect(f.errors()).toEqual([]);
  });

  it('reset restores pristine state', () => {
    const f = createField('x');
    f.setValue('y');
    expect(f.dirty()).toBe(true);
    f.reset();
    expect(f.value()).toBe('x');
    expect(f.dirty()).toBe(false);
    expect(f.touched()).toBe(false);
  });
});

describe('createForm (group)', () => {
  it('aggregates validity + values', () => {
    const form = createForm({
      name: createField('', { validators: [required()] }),
      email: createField('', { validators: [required(), email()] }),
    });
    expect(form.valid()).toBe(false);
    form.get('name').setValue('Ada');
    form.get('email').setValue('ada@example.com');
    expect(form.valid()).toBe(true);
    expect(form.value()).toEqual({ name: 'Ada', email: 'ada@example.com' });
  });

  it('cross-field validator (confirm) reacts fine-grained', () => {
    const form = createForm({
      pw: createField('secret'),
      confirm: createField('', { validators: [sameAs('pw', 'must match')] }),
    });
    expect(form.get('confirm').valid()).toBe(false);
    form.get('confirm').setValue('secret');
    expect(form.get('confirm').valid()).toBe(true);
    form.get('pw').setValue('changed'); // dependent recomputes
    expect(form.get('confirm').valid()).toBe(false);
  });

  it('submit validates, marks touched, calls onValid only when valid', async () => {
    const form = createForm({ name: createField('', { validators: [required()] }) });
    let called = 0;
    expect(await form.submit(() => called++)).toBe(false);
    expect(form.get('name').touched()).toBe(true);
    expect(called).toBe(0);

    form.get('name').setValue('Bob');
    expect(await form.submit((v) => { called++; expect(v.name).toBe('Bob'); })).toBe(true);
    expect(called).toBe(1);
  });
});

describe('async validation', () => {
  it('toggles pending then resolves', async () => {
    const taken = new Set(['taken']);
    const f = createField('', {
      debounce: 5,
      asyncValidators: [
        async (v) => (taken.has(v) ? { type: 'taken', message: 'in use' } : null),
      ],
    });
    f.setValue('taken');
    expect(f.pending()).toBe(true);
    await tick(20);
    expect(f.pending()).toBe(false);
    expect(f.error()?.type).toBe('taken');

    f.setValue('free');
    await tick(20);
    expect(f.valid()).toBe(true);
  });
});

describe('createFormArray', () => {
  it('push/remove/move + aggregate validity', () => {
    const arr = createFormArray<string>([
      createField('a', { validators: [required()] }),
      createField('b', { validators: [required()] }),
    ]);
    expect(arr.length()).toBe(2);
    expect(arr.value()).toEqual(['a', 'b']);
    expect(arr.valid()).toBe(true);

    arr.push(createField('', { validators: [required()] }));
    expect(arr.length()).toBe(3);
    expect(arr.valid()).toBe(false); // new empty required item

    arr.removeAt(2);
    expect(arr.valid()).toBe(true);

    arr.move(0, 1);
    expect(arr.value()).toEqual(['b', 'a']);
  });

  it('pushValue/insertValue wrap plain values (default field factory)', () => {
    interface Row { id: string; qty: number }
    const arr = createFormArray<Row>([], { validators: [required('add one')] });
    expect(arr.valid()).toBe(false); // empty required array

    arr.pushValue({ id: 'a', qty: 1 });
    arr.pushValue({ id: 'b', qty: 2 });
    expect(arr.length()).toBe(2);
    expect(arr.value()).toEqual([{ id: 'a', qty: 1 }, { id: 'b', qty: 2 }]);
    expect(arr.valid()).toBe(true);

    arr.insertValue(1, { id: 'c', qty: 3 });
    expect(arr.value().map((r) => r.id)).toEqual(['a', 'c', 'b']);

    arr.removeAt(0);
    expect(arr.value().map((r) => r.id)).toEqual(['c', 'b']);
  });

  it('pushValue uses a custom control factory for structured rows', () => {
    const arr = createFormArray<{ name: string }>([], {
      control: (v) => createGroup({ name: createField(v.name) }) as any,
    });
    arr.pushValue({ name: 'x' });
    expect(arr.value()).toEqual([{ name: 'x' }]);
    expect(arr.controls()[0].kind).toBe('group');
  });
});
