import type { Unit } from '../types/weather';

export function toFahrenheit(celsius: number): number {
  return celsius * (9 / 5) + 32;
}

export function convertTemperature(celsius: number, unit: Unit): number {
  return unit === 'fahrenheit' ? toFahrenheit(celsius) : celsius;
}

export function unitLabel(unit: Unit): string {
  return unit === 'fahrenheit' ? '°F' : '°C';
}

export function formatTemperature(celsius: number | null | undefined, unit: Unit): string {
  if (celsius == null || !Number.isFinite(celsius)) return 'Indisponível';
  const value = convertTemperature(celsius, unit);
  const rounded = Math.sign(value) * Math.round(Math.abs(value));
  return `${rounded}${unitLabel(unit)}`;
}
