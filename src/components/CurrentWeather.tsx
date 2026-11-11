import { formatTemperature } from '../lib/temperature';
import { getWeatherInfo } from '../lib/weatherCodes';
import type { City, CurrentWeather as CurrentWeatherData, Unit } from '../types/weather';

interface CurrentWeatherProps {
  city: City;
  current: CurrentWeatherData;
  unit: Unit;
}

function formatMetric(value: number | null | undefined, unit: string): string {
  return value == null || !Number.isFinite(value) ? 'Indisponível' : `${value} ${unit}`;
}

function formatObservation(observedAt: string | null, timezone: string | undefined): string {
  if (!observedAt || !timezone) return 'Indisponível';

  try {
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
    });
    const localTime = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::[0-5]\d)?$/.exec(observedAt);
    if (localTime) {
      const [, year, month, day, hour, minute] = localTime;
      const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:00Z`);
      if (
        Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 16) !== observedAt.slice(0, 16)
      ) {
        return 'Indisponível';
      }
      return `${hour}:${minute}`;
    }
    if (!/(?:Z|[+-]\d{2}:\d{2})$/i.test(observedAt)) return 'Indisponível';
    const date = new Date(observedAt);
    return Number.isNaN(date.getTime()) ? 'Indisponível' : formatter.format(date);
  } catch {
    return 'Indisponível';
  }
}

export default function CurrentWeather({ city, current, unit }: CurrentWeatherProps) {
  const condition = getWeatherInfo(current.conditionCode);
  const location = [city.region, city.country].filter(Boolean).join(', ');
  const metrics = [
    { label: 'Umidade', value: formatMetric(current.humidityPercent, '%') },
    { label: 'Vento', value: formatMetric(current.windSpeedKmh, 'km/h') },
    { label: 'Precipitação', value: formatMetric(current.precipitationMm, 'mm') },
    { label: 'Pressão', value: formatMetric(current.pressureHpa, 'hPa') },
  ];

  return (
    <section aria-label="Clima atual" className="border-y border-white/10 py-6 text-white md:py-8">
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold md:text-3xl">{city.name}</h2>
          {location && <p className="mt-1 text-white/70">{location}</p>}
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <span aria-hidden="true" className="text-5xl">
              {condition.icon}
            </span>
            <p
              className={
                current.temperatureC === null || !Number.isFinite(current.temperatureC)
                  ? 'text-2xl font-light'
                  : 'text-6xl font-light md:text-7xl'
              }
            >
              {formatTemperature(current.temperatureC, unit)}
            </p>
          </div>
          <p className="mt-2 text-lg">{condition.label}</p>
          <p className="mt-2 text-sm text-white/70">
            Sensação térmica: {formatTemperature(current.feelsLikeC, unit)}
          </p>
          <p className="mt-1 text-sm text-white/70">
            Observação local: {formatObservation(current.observedAt, city.timezone)}
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-4 sm:gap-x-12">
          {metrics.map((metric) => (
            <div key={metric.label}>
              <dt className="text-sm text-white/70">{metric.label}</dt>
              <dd className="mt-1 font-semibold">{metric.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
