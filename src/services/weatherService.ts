import type { City, WeatherData, WeatherError, WeatherErrorKind } from '../types/weather';

export class WeatherServiceError extends Error implements WeatherError {
  constructor(
    public readonly kind: WeatherErrorKind,
    message: string,
    public readonly retryable: boolean,
  ) {
    super(message);
    this.name = 'WeatherServiceError';
  }
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError'
  );
}

async function fetchWithTimeout(
  url: string,
  apiMessage: string,
  invalidResponseMessage: string,
): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new WeatherServiceError('api', apiMessage, true);

    try {
      return await response.json();
    } catch (error) {
      if (
        controller.signal.aborted ||
        isAbortError(error) ||
        (typeof error === 'object' &&
          error !== null &&
          'name' in error &&
          error.name === 'TypeError')
      ) {
        throw error;
      }
      throw new WeatherServiceError('invalid-response', invalidResponseMessage, true);
    }
  } catch (error) {
    if (controller.signal.aborted || isAbortError(error)) {
      throw new WeatherServiceError('timeout', 'A requisição demorou demais.', true);
    }
    if (error instanceof WeatherServiceError) throw error;
    throw new WeatherServiceError('network', 'Falha de rede.', true);
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeCity(value: unknown): City | null {
  if (typeof value !== 'object' || value === null) return null;

  const city = value as Record<string, unknown>;
  if (
    typeof city.id !== 'number' ||
    !Number.isFinite(city.id) ||
    typeof city.name !== 'string' ||
    typeof city.latitude !== 'number' ||
    !Number.isFinite(city.latitude) ||
    Math.abs(city.latitude) > 90 ||
    typeof city.longitude !== 'number' ||
    !Number.isFinite(city.longitude) ||
    Math.abs(city.longitude) > 180
  ) {
    return null;
  }

  return {
    id: city.id,
    name: city.name,
    latitude: city.latitude,
    longitude: city.longitude,
    ...(typeof city.admin1 === 'string' ? { region: city.admin1 } : {}),
    ...(typeof city.country === 'string' ? { country: city.country } : {}),
    ...(typeof city.timezone === 'string' ? { timezone: city.timezone } : {}),
  };
}

export async function searchCities(name: string): Promise<City[]> {
  const term = name.trim();
  if (!term) return [];

  const data = await fetchWithTimeout(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(term)}&count=10&language=pt&format=json`,
    'Não foi possível buscar cidades.',
    'Resposta de busca inválida.',
  );

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new WeatherServiceError('invalid-response', 'Resposta de busca inválida.', true);
  }

  const results = (data as Record<string, unknown>).results;
  if (results === undefined) return [];
  if (!Array.isArray(results)) {
    throw new WeatherServiceError('invalid-response', 'Resposta de busca inválida.', true);
  }
  return results.map(normalizeCity).filter((city): city is City => city !== null);
}

export async function getWeather(city: City): Promise<WeatherData> {
  if (
    !Number.isFinite(city.latitude) ||
    Math.abs(city.latitude) > 90 ||
    !Number.isFinite(city.longitude) ||
    Math.abs(city.longitude) > 180
  ) {
    throw new WeatherServiceError('invalid-location', 'Localização inválida.', false);
  }

  const invalidResponse = () =>
    new WeatherServiceError('invalid-response', 'Resposta meteorológica inválida.', true);

  try {
    const params = new URLSearchParams({
      latitude: String(city.latitude),
      longitude: String(city.longitude),
      current:
        'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
      temperature_unit: 'celsius',
      wind_speed_unit: 'kmh',
      timezone: 'auto',
      forecast_days: '5',
    });
    const data = await fetchWithTimeout(
      `https://api.open-meteo.com/v1/forecast?${params}`,
      'Não foi possível consultar a previsão.',
      'Resposta meteorológica inválida.',
    );

    if (typeof data !== 'object' || data === null || Array.isArray(data)) throw invalidResponse();
    const payload = data as Record<string, unknown>;
    if (
      typeof payload.current !== 'object' ||
      payload.current === null ||
      Array.isArray(payload.current) ||
      typeof payload.daily !== 'object' ||
      payload.daily === null ||
      Array.isArray(payload.daily)
    ) {
      throw invalidResponse();
    }

    const current = payload.current as Record<string, unknown>;
    const daily = payload.daily as Record<string, unknown>;
    const numberOrNull = (value: unknown): number | null => {
      if (value === null || value === undefined) return null;
      if (typeof value !== 'number' || !Number.isFinite(value)) throw invalidResponse();
      return value;
    };
    if (current.time != null && typeof current.time !== 'string') throw invalidResponse();
    const dates = daily.time;
    const codes = daily.weather_code;
    const minimums = daily.temperature_2m_min;
    const maximums = daily.temperature_2m_max;
    const probabilities = daily.precipitation_probability_max;
    if (
      !Array.isArray(dates) ||
      !Array.isArray(codes) ||
      !Array.isArray(minimums) ||
      !Array.isArray(maximums) ||
      !Array.isArray(probabilities) ||
      [codes, minimums, maximums, probabilities].some((values) => values.length !== dates.length)
    ) {
      throw invalidResponse();
    }

    const days = dates.map((date: unknown, index: number) => {
      if (
        typeof date !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        Number.isNaN(Date.parse(`${date}T00:00:00Z`)) ||
        new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date ||
        (index > 0 && date <= dates[index - 1])
      ) {
        throw invalidResponse();
      }
      return {
        localDate: date,
        conditionCode: numberOrNull(codes[index]),
        minimumC: numberOrNull(minimums[index]),
        maximumC: numberOrNull(maximums[index]),
        precipitationProbabilityPercent: numberOrNull(probabilities[index]),
      };
    });

    return {
      city: typeof payload.timezone === 'string' ? { ...city, timezone: payload.timezone } : city,
      current: {
        temperatureC: numberOrNull(current.temperature_2m),
        feelsLikeC: numberOrNull(current.apparent_temperature),
        humidityPercent: numberOrNull(current.relative_humidity_2m),
        windSpeedKmh: numberOrNull(current.wind_speed_10m),
        observedAt: current.time ?? null,
        conditionCode: numberOrNull(current.weather_code),
      },
      forecast: { days: days.slice(0, 5), isIncomplete: days.length < 5 },
    };
  } catch (error) {
    if (error instanceof WeatherServiceError) throw error;
    throw new WeatherServiceError('network', 'Falha de rede.', true);
  }
}
