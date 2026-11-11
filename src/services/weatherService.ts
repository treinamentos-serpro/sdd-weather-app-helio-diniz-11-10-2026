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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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
      throw new WeatherServiceError(
        'timeout',
        'A consulta demorou mais de 10 segundos. Tente novamente.',
        true,
      );
    }
    if (error instanceof WeatherServiceError) throw error;
    throw new WeatherServiceError(
      'network',
      'Não foi possível conectar. Verifique sua conexão e tente novamente.',
      true,
    );
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

    if (!isRecord(data)) throw invalidResponse();
    const payload = data;
    const current = payload.current;
    const daily = payload.daily;
    if ((current != null && !isRecord(current)) || (daily != null && !isRecord(daily))) {
      throw invalidResponse();
    }

    const numberOrNull = (value: unknown): number | null => {
      if (value === null || value === undefined) return null;
      if (typeof value !== 'number' || !Number.isFinite(value)) throw invalidResponse();
      return value;
    };
    const optionalArray = (section: Record<string, unknown>, key: string): unknown[] => {
      const value = section[key];
      if (value === null || value === undefined) return [];
      if (!Array.isArray(value)) throw invalidResponse();
      return value;
    };

    if (isRecord(current) && current.time != null && typeof current.time !== 'string') {
      throw invalidResponse();
    }

    let days: NonNullable<WeatherData['forecast']>['days'] = [];
    let forecastAvailable = false;
    if (isRecord(daily) && Array.isArray(daily.time)) {
      const dates = daily.time;
      const codes = optionalArray(daily, 'weather_code');
      const minimums = optionalArray(daily, 'temperature_2m_min');
      const maximums = optionalArray(daily, 'temperature_2m_max');
      const probabilities = optionalArray(daily, 'precipitation_probability_max');
      let previousDate: string | null = null;
      days = dates.flatMap((date: unknown, index: number) => {
        if (date == null) return [];
        if (
          typeof date !== 'string' ||
          !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
          Number.isNaN(Date.parse(`${date}T00:00:00Z`)) ||
          new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date ||
          (previousDate !== null && date <= previousDate)
        ) {
          throw invalidResponse();
        }
        previousDate = date;
        return {
          localDate: date,
          conditionCode: numberOrNull(codes[index]),
          minimumC: numberOrNull(minimums[index]),
          maximumC: numberOrNull(maximums[index]),
          precipitationProbabilityPercent: numberOrNull(probabilities[index]),
        };
      });
      forecastAvailable = true;
    } else if (isRecord(daily) && daily.time != null) {
      throw invalidResponse();
    }

    return {
      city: {
        ...city,
        timezone:
          typeof payload.timezone === 'string' && payload.timezone.trim()
            ? payload.timezone
            : undefined,
      },
      current: isRecord(current)
        ? {
            temperatureC: numberOrNull(current.temperature_2m),
            feelsLikeC: numberOrNull(current.apparent_temperature),
            humidityPercent: numberOrNull(current.relative_humidity_2m),
            windSpeedKmh: numberOrNull(current.wind_speed_10m),
            observedAt: typeof current.time === 'string' ? current.time : null,
            conditionCode: numberOrNull(current.weather_code),
          }
        : null,
      forecast: forecastAvailable
        ? { days: days.slice(0, 5), isIncomplete: days.length < 5 }
        : null,
    };
  } catch (error) {
    if (error instanceof WeatherServiceError) throw error;
    throw new WeatherServiceError(
      'network',
      'Não foi possível conectar. Verifique sua conexão e tente novamente.',
      true,
    );
  }
}
