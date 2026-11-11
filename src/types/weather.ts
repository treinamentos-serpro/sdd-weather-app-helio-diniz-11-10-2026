export type Unit = 'celsius' | 'fahrenheit';

export interface City {
  id: number;
  name: string;
  region?: string;
  country?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

export interface CurrentWeather {
  temperatureC: number | null;
  feelsLikeC: number | null;
  humidityPercent: number | null;
  windSpeedKmh: number | null;
  precipitationMm?: number | null;
  pressureHpa?: number | null;
  observedAt: string | null;
  conditionCode: number | null;
}

export interface ForecastDay {
  localDate: string;
  conditionCode: number | null;
  minimumC: number | null;
  maximumC: number | null;
  precipitationProbabilityPercent: number | null;
}

export interface Forecast {
  days: ForecastDay[];
  isIncomplete: boolean;
}

export interface WeatherData {
  city: City;
  current: CurrentWeather | null;
  forecast: Forecast | null;
}

export type WeatherErrorKind =
  | 'network'
  | 'api'
  | 'timeout'
  | 'invalid-response'
  | 'invalid-location';

export interface WeatherError {
  kind: WeatherErrorKind;
  message: string;
  retryable: boolean;
}

export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'empty'; message: string }
  | { status: 'error'; error: WeatherError };
