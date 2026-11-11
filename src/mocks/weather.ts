import type { WeatherData } from '../types/weather';

export const mockWeatherData: WeatherData = {
  city: {
    id: 3448439,
    name: 'São Paulo',
    region: 'São Paulo',
    country: 'Brasil',
    latitude: -23.5475,
    longitude: -46.6361,
    timezone: 'America/Sao_Paulo',
  },
  current: {
    temperatureC: 24,
    feelsLikeC: 25,
    humidityPercent: 68,
    windSpeedKmh: 12,
    observedAt: '2026-11-11T12:00',
    conditionCode: 2,
  },
  forecast: {
    isIncomplete: false,
    days: [
      {
        localDate: '2026-11-11',
        conditionCode: 2,
        minimumC: 18,
        maximumC: 26,
        precipitationProbabilityPercent: 20,
      },
      {
        localDate: '2026-11-12',
        conditionCode: 3,
        minimumC: 19,
        maximumC: 25,
        precipitationProbabilityPercent: 30,
      },
      {
        localDate: '2026-11-13',
        conditionCode: 61,
        minimumC: 18,
        maximumC: 23,
        precipitationProbabilityPercent: 75,
      },
      {
        localDate: '2026-11-14',
        conditionCode: 80,
        minimumC: 17,
        maximumC: 24,
        precipitationProbabilityPercent: 60,
      },
      {
        localDate: '2026-11-15',
        conditionCode: 1,
        minimumC: 17,
        maximumC: 27,
        precipitationProbabilityPercent: 10,
      },
    ],
  },
};
