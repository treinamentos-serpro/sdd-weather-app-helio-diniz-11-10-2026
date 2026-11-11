import { afterEach, describe, expect, it, vi } from 'vitest';
import { getWeather, searchCities, WeatherServiceError } from '../../src/services/weatherService';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe.each([
  ['busca', () => searchCities('cidade')],
  ['previsão', () => getWeather({ id: 1, name: 'Cidade', latitude: 0, longitude: 0 })],
])('%s: erros e limpeza da requisição', (_label, request) => {
  it('converts network and AbortError failures to typed errors and clears the timer', async () => {
    vi.useFakeTimers();
    for (const [error, kind, message] of [
      [new TypeError('network'), 'network', 'Falha de rede.'],
      [new DOMException('aborted', 'AbortError'), 'timeout', 'A requisição demorou demais.'],
    ] as const) {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(error));
      await expect(request()).rejects.toMatchObject({
        name: 'WeatherServiceError',
        kind,
        message,
        retryable: true,
      });
      expect(vi.getTimerCount()).toBe(0);
    }
  });

  it('clears the timer after a successful response and an HTTP error', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    await expect(request()).rejects.toMatchObject({ kind: 'api' });
    expect(vi.getTimerCount()).toBe(0);

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          current: {},
          daily: {
            time: [],
            weather_code: [],
            temperature_2m_min: [],
            temperature_2m_max: [],
            precipitation_probability_max: [],
          },
        }),
      }),
    );
    await expect(request()).resolves.toBeDefined();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('classifies network failures while reading the response body', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => {
          throw new TypeError('network');
        },
      }),
    );
    await expect(request()).rejects.toMatchObject({ kind: 'network', message: 'Falha de rede.' });
    expect(vi.getTimerCount()).toBe(0);
  });

  it('times out while reading the response body', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, options: { signal: AbortSignal }) => ({
        ok: true,
        json: () =>
          new Promise((_resolve, reject) => {
            options.signal.addEventListener('abort', () =>
              reject(new DOMException('aborted', 'AbortError')),
            );
          }),
      })),
    );
    const assertion = expect(request()).rejects.toMatchObject({
      kind: 'timeout',
      message: 'A requisição demorou demais.',
    });
    await vi.advanceTimersByTimeAsync(10_000);
    await assertion;
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('getWeather', () => {
  const city = { id: 1, name: 'São Paulo', latitude: -23.5, longitude: -46.6 };
  const payload = {
    timezone: 'America/Sao_Paulo',
    current: {
      time: '2026-11-11T09:00',
      temperature_2m: 21.4,
      relative_humidity_2m: 68,
      apparent_temperature: 22.1,
      weather_code: 3,
      wind_speed_10m: 10.1,
    },
    daily: {
      time: ['2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15'],
      weather_code: [3, 61, 1, 2, 0],
      temperature_2m_max: [24, 22.5, 25, 26, 27],
      temperature_2m_min: [17.2, 16.8, 18, 19, 20],
      precipitation_probability_max: [10, 65, 20, 30, 0],
    },
  };

  it('requests and maps current weather and five daily forecasts', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => payload });
    vi.stubGlobal('fetch', fetchMock);
    await expect(getWeather(city)).resolves.toEqual({
      city: { ...city, timezone: 'America/Sao_Paulo' },
      current: {
        observedAt: '2026-11-11T09:00',
        temperatureC: 21.4,
        humidityPercent: 68,
        feelsLikeC: 22.1,
        conditionCode: 3,
        windSpeedKmh: 10.1,
      },
      forecast: {
        isIncomplete: false,
        days: payload.daily.time.map((localDate, index) => ({
          localDate,
          conditionCode: payload.daily.weather_code[index],
          minimumC: payload.daily.temperature_2m_min[index],
          maximumC: payload.daily.temperature_2m_max[index],
          precipitationProbabilityPercent: payload.daily.precipitation_probability_max[index],
        })),
      },
    });
    const [url, options] = fetchMock.mock.calls[0];
    const request = new URL(url);
    expect(request.origin + request.pathname).toBe('https://api.open-meteo.com/v1/forecast');
    expect(Object.fromEntries(request.searchParams)).toEqual({
      latitude: '-23.5',
      longitude: '-46.6',
      current:
        'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
      temperature_unit: 'celsius',
      wind_speed_unit: 'kmh',
      timezone: 'auto',
      forecast_days: '5',
    });
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });

  it.each([
    { daily: payload.daily },
    { current: payload.current },
    null,
  ])('rejects incomplete responses', async (data) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => data }));
    await expect(getWeather(city)).rejects.toMatchObject({
      name: 'WeatherServiceError',
      kind: 'invalid-response',
    });
  });

  it('marks a short forecast incomplete without inventing days', async () => {
    const daily = Object.fromEntries(
      Object.entries(payload.daily).map(([key, values]) => [key, values.slice(0, 2)]),
    );
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ...payload, daily }) }),
    );
    const result = await getWeather(city);
    expect(result.forecast).toMatchObject({ isIncomplete: true, days: expect.any(Array) });
    expect(result.forecast?.days).toHaveLength(2);
  });

  it('rejects mismatched daily arrays', async () => {
    const daily = { ...payload.daily, weather_code: [3] };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ...payload, daily }) }),
    );
    await expect(getWeather(city)).rejects.toMatchObject({ kind: 'invalid-response' });
  });

  it('rejects invalid and out-of-order dates', async () => {
    for (const dates of [
      ['2026-02-30', ...payload.daily.time.slice(1)],
      ['2026-11-12', '2026-11-11', ...payload.daily.time.slice(2)],
    ]) {
      const daily = { ...payload.daily, time: dates };
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ...payload, daily }) }),
      );
      await expect(getWeather(city)).rejects.toMatchObject({ kind: 'invalid-response' });
    }
  });

  it('classifies invalid coordinates and request failures', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(getWeather({ ...city, latitude: 91 })).rejects.toMatchObject({
      kind: 'invalid-location',
      retryable: false,
    });
    expect(fetchMock).not.toHaveBeenCalled();

    fetchMock.mockResolvedValueOnce({ ok: false });
    await expect(getWeather(city)).rejects.toMatchObject({ kind: 'api', retryable: true });
    fetchMock.mockRejectedValueOnce(new TypeError('network'));
    await expect(getWeather(city)).rejects.toMatchObject({ kind: 'network', retryable: true });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new SyntaxError();
      },
    });
    await expect(getWeather(city)).rejects.toMatchObject({ kind: 'invalid-response' });
  });

  it('aborts weather requests after 10 seconds', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, options: { signal: AbortSignal }) =>
          new Promise((_resolve, reject) => {
            options.signal.addEventListener('abort', () => reject(new Error('aborted')));
          }),
      ),
    );
    const request = getWeather(city);
    const assertion = expect(request).rejects.toMatchObject({
      kind: 'timeout',
      message: 'A requisição demorou demais.',
      retryable: true,
    });
    await vi.advanceTimersByTimeAsync(10_000);
    await assertion;
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('searchCities', () => {
  it('does not request empty or whitespace-only searches', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(searchCities('')).resolves.toEqual([]);
    await expect(searchCities('   ')).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('encodes the trimmed name and maps valid results and optional metadata', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            id: 1,
            name: 'São Paulo',
            latitude: -23.5,
            longitude: -46.6,
            admin1: 'SP',
            country: 'Brasil',
            timezone: 'America/Sao_Paulo',
          },
          { id: 2, name: 'Outro', latitude: 1, longitude: 2 },
          { id: 3, name: 'Inválido', latitude: 91, longitude: 0 },
        ],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(searchCities(' São Paulo & região ')).resolves.toEqual([
      {
        id: 1,
        name: 'São Paulo',
        latitude: -23.5,
        longitude: -46.6,
        region: 'SP',
        country: 'Brasil',
        timezone: 'America/Sao_Paulo',
      },
      { id: 2, name: 'Outro', latitude: 1, longitude: 2 },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://geocoding-api.open-meteo.com/v1/search?name=S%C3%A3o%20Paulo%20%26%20regi%C3%A3o&count=10&language=pt&format=json',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('returns an empty list when the API has no results', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
    await expect(searchCities('cidade')).resolves.toEqual([]);
  });

  it('throws a typed error for non-ok responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    await expect(searchCities('cidade')).rejects.toBeInstanceOf(WeatherServiceError);
    await expect(searchCities('cidade')).rejects.toMatchObject({ kind: 'api', retryable: true });
  });

  it('converts network and invalid response failures to typed errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network')));
    await expect(searchCities('cidade')).rejects.toMatchObject({ kind: 'network' });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ results: null }) }),
    );
    await expect(searchCities('cidade')).rejects.toMatchObject({ kind: 'invalid-response' });
  });

  it('aborts requests that exceed the timeout', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, options: { signal: AbortSignal }) =>
          new Promise((_resolve, reject) => {
            options.signal.addEventListener('abort', () => reject(new Error('aborted')));
          }),
      ),
    );

    const request = searchCities('cidade');
    const assertion = expect(request).rejects.toMatchObject({
      kind: 'timeout',
      message: 'A requisição demorou demais.',
      retryable: true,
    });
    await vi.advanceTimersByTimeAsync(10_000);
    await assertion;
    expect(vi.getTimerCount()).toBe(0);
  });
});
