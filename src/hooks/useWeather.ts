import { useEffect, useRef, useState } from 'react';
import { getWeather, searchCities, WeatherServiceError } from '../services/weatherService';
import type { AsyncState, City, WeatherData } from '../types/weather';

export function useWeather() {
  const [state, setState] = useState<AsyncState<WeatherData>>({ status: 'idle' });
  const requestId = useRef(0);
  const lastOperation = useRef<{ query: string; city?: City } | null>(null);

  useEffect(
    () => () => {
      requestId.current += 1;
    },
    [],
  );

  async function run(query: string, city?: City) {
    const currentRequest = ++requestId.current;
    lastOperation.current = { query, city };
    setState({ status: 'loading' });

    try {
      let selectedCity = city;
      if (!selectedCity) {
        const results = await searchCities(query);
        if (currentRequest !== requestId.current) return;
        if (results.length === 0) {
          setState({ status: 'empty', message: 'Nenhuma cidade encontrada' });
          return;
        }
        selectedCity = results[0];
        lastOperation.current = { query, city: selectedCity };
      }

      const data = await getWeather(selectedCity);
      if (currentRequest === requestId.current) setState({ status: 'success', data });
    } catch (error) {
      if (currentRequest !== requestId.current) return;
      setState({
        status: 'error',
        error:
          error instanceof WeatherServiceError
            ? error
            : {
                kind: 'network',
                message: 'Não foi possível carregar os dados. Tente novamente.',
                retryable: true,
              },
      });
    }
  }

  function search(query: string) {
    const trimmed = query.trim();
    if (trimmed) void run(trimmed);
  }

  function retry() {
    const operation = lastOperation.current;
    if (operation) void run(operation.query, operation.city);
  }

  return { state, search, retry };
}
