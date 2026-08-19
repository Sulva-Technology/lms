import { describe, expect, it } from 'vitest';
import { describeDataError } from '@/lib/errors/data-error';

describe('describeDataError', () => {
  it('reads a PostgREST error, which arrives as a plain object rather than an Error', () => {
    const message = describeDataError(
      {
        message: 'permission denied for table profiles',
        details: null,
        hint: null,
        code: '42501',
      },
      'Could not load students.',
    );

    expect(message).toBe('permission denied for table profiles (42501)');
  });

  it('appends details when they say something the message does not', () => {
    const message = describeDataError(
      { message: 'new row violates row-level security policy', details: 'Failing row contains (1)', code: '42501' },
      'Could not save.',
    );

    expect(message).toBe('new row violates row-level security policy — Failing row contains (1) (42501)');
  });

  it('still reads a plain Error', () => {
    expect(describeDataError(new Error('fetch failed'), 'Could not load.')).toBe('fetch failed');
  });

  it('falls back when there is nothing to report', () => {
    expect(describeDataError(null, 'Could not load.')).toBe('Could not load.');
    expect(describeDataError({ message: '   ' }, 'Could not load.')).toBe('Could not load.');
  });
});
