import { describe, expect, it } from 'vitest';
import { mockWeatherData } from '../../src/mocks/weather';

describe('mockWeatherData', () => {
  it('provides current weather and five consecutive forecast days', () => {
    expect(mockWeatherData.city.name).toBeTruthy();
    expect(mockWeatherData.city.timezone).toBeTruthy();
    expect(mockWeatherData.current).not.toBeNull();
    expect(mockWeatherData.forecast?.isIncomplete).toBe(false);

    const days = mockWeatherData.forecast?.days ?? [];
    expect(days).toHaveLength(5);
    expect(days[0]?.localDate).toBe(mockWeatherData.current?.observedAt?.slice(0, 10));

    for (let index = 1; index < days.length; index += 1) {
      const previousDate = Date.parse(`${days[index - 1].localDate}T00:00:00Z`);
      const currentDate = Date.parse(`${days[index].localDate}T00:00:00Z`);
      expect(currentDate - previousDate).toBe(24 * 60 * 60 * 1000);
    }
  });
});
