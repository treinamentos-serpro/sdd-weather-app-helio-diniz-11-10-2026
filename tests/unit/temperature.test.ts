import { describe, expect, it } from 'vitest';
import {
  convertTemperature,
  formatTemperature,
  toFahrenheit,
  unitLabel,
} from '../../src/lib/temperature';

describe('toFahrenheit', () => {
  it.each([
    [0, 32],
    [100, 212],
    [-40, -40],
  ])('converts %i°C to %i°F', (celsius, fahrenheit) => {
    expect(toFahrenheit(celsius)).toBe(fahrenheit);
  });
});

describe('convertTemperature', () => {
  it('keeps Celsius values unchanged', () => {
    expect(convertTemperature(25, 'celsius')).toBe(25);
  });

  it('converts Celsius values to Fahrenheit when requested', () => {
    expect(convertTemperature(25, 'fahrenheit')).toBe(77);
  });
});

describe('formatTemperature', () => {
  it.each([
    [20.4, 'celsius', '20°C'],
    [20.5, 'celsius', '21°C'],
    [-20.5, 'celsius', '-21°C'],
    [0, 'fahrenheit', '32°F'],
    [25, 'fahrenheit', '77°F'],
    [-40, 'fahrenheit', '-40°F'],
  ] as const)('formats %s°C in %s as %s', (celsius, unit, expected) => {
    expect(formatTemperature(celsius, unit)).toBe(expected);
  });

  it('returns an unavailable label for null or non-finite values', () => {
    expect(formatTemperature(null, 'celsius')).toBe('Indisponível');
    expect(formatTemperature(Number.NaN, 'fahrenheit')).toBe('Indisponível');
  });
});

describe('unitLabel', () => {
  it('returns the symbol for each unit', () => {
    expect(unitLabel('celsius')).toBe('°C');
    expect(unitLabel('fahrenheit')).toBe('°F');
  });
});
