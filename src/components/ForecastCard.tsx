import { formatForecastDay } from '../lib/format';
import { formatTemperature } from '../lib/temperature';
import { getWeatherInfo } from '../lib/weatherCodes';
import type { ForecastDay, Unit } from '../types/weather';

interface ForecastCardProps {
  day: ForecastDay;
  unit: Unit;
}

export default function ForecastCard({ day, unit }: ForecastCardProps) {
  const condition = getWeatherInfo(day.conditionCode);
  const precipitation = day.precipitationProbabilityPercent;

  return (
    <article className="rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-md">
      <h3 className="font-semibold capitalize">{formatForecastDay(day.localDate)}</h3>
      <span aria-hidden="true" className="mt-3 block text-3xl">
        {condition.icon}
      </span>
      <p className="mt-2 text-sm">{condition.label}</p>
      <dl className="mt-4 space-y-1 text-sm">
        <div>
          <dt className="inline text-white/70">Máxima: </dt>
          <dd className="inline">{formatTemperature(day.maximumC, unit)}</dd>
        </div>
        <div>
          <dt className="inline text-white/70">Mínima: </dt>
          <dd className="inline">{formatTemperature(day.minimumC, unit)}</dd>
        </div>
        <div>
          <dt className="inline text-white/70">Chuva: </dt>
          <dd className="inline">
            {precipitation === null || !Number.isFinite(precipitation)
              ? 'Indisponível'
              : `${precipitation}%`}
          </dd>
        </div>
      </dl>
    </article>
  );
}
