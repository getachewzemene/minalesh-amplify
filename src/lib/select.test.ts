import { describe, it, expect } from 'vitest';
import { ALL, NONE, isAll, isNone, isSentinel, toSentinel, fromSentinel } from './select';

describe('select helpers', () => {
  it('detects sentinel values', () => {
    expect(isSentinel(ALL)).toBe(true);
    expect(isSentinel(NONE)).toBe(true);
    expect(isSentinel('other')).toBe(false);
  });

  it('isAll and isNone guards', () => {
    expect(isAll(ALL)).toBe(true);
    expect(isAll(NONE)).toBe(false);
    expect(isNone(NONE)).toBe(true);
    expect(isNone(ALL)).toBe(false);
  });

  it('toSentinel maps empty string to provided sentinel', () => {
    expect(toSentinel('', ALL)).toBe(ALL);
    expect(toSentinel('', NONE)).toBe(NONE);
    expect(toSentinel('value', ALL)).toBe('value');
  });

  it('fromSentinel maps sentinel back to empty string', () => {
    expect(fromSentinel(ALL)).toBe('');
    expect(fromSentinel(NONE)).toBe('');
    expect(fromSentinel('value')).toBe('value');
  });
});
