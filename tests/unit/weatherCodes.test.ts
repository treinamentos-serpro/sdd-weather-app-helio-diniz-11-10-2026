import { describe, expect, it } from 'vitest';
import { getWeatherIcon, getWeatherInfo, getWeatherLabel } from '../../src/lib/weatherCodes';

describe('weather codes', () => {
  it('maps a known WMO code to its Portuguese condition and icon', () => {
    expect(getWeatherInfo(0)).toEqual({ label: 'Céu limpo', icon: '☀️' });
    expect(getWeatherInfo(61)).toEqual({ label: 'Chuva fraca', icon: '🌦️' });
  });

  it.each([999, null])('uses an explicit fallback for unknown code %s', (code) => {
    expect(getWeatherInfo(code)).toEqual({
      label: 'Condição indisponível',
      icon: '🌡️',
    });
    expect(getWeatherLabel(code)).toBe('Condição indisponível');
    expect(getWeatherIcon(code)).toBe('🌡️');
  });
});
