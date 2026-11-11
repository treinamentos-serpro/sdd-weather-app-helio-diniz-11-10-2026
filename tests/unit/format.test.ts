import { describe, expect, it } from 'vitest';
import { formatForecastDay, getShortDate } from '../../src/lib/format';

describe('formatForecastDay', () => {
  it('formats a valid forecast date in Brazilian Portuguese', () => {
    expect(formatForecastDay('2026-11-11')).toBe('quarta-feira, 11/11/2026');
  });

  it.each(['2026-02-29', '2026-11-11T00:00:00Z', 'invalid'])('rejects invalid date %s', (date) => {
    expect(formatForecastDay(date)).toBe('Data indisponível');
  });
});

describe('getShortDate', () => {
  it('uses relative labels for the first two forecast days', () => {
    expect(getShortDate('2026-11-11', 0)).toBe('Hoje');
    expect(getShortDate('2026-11-12', 1)).toBe('Amanhã');
  });

  it.each([
    ['2026-11-13', 2, 'sexta-feira'],
    ['2026-11-15', 4, 'domingo'],
  ])('formats day %i as its weekday', (date, index, weekday) => {
    expect(getShortDate(date, index)).toBe(weekday);
  });

  it('returns an unavailable label for invalid dates', () => {
    expect(getShortDate('2026-02-29', 0)).toBe('Data indisponível');
  });
});
