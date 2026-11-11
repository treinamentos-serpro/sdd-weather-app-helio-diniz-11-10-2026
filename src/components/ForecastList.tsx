import type { Forecast, Unit } from '../types/weather';
import ForecastCard from './ForecastCard';

interface ForecastListProps {
  forecast: Forecast;
  unit: Unit;
}

export default function ForecastList({ forecast, unit }: ForecastListProps) {
  return (
    <section aria-labelledby="forecast-heading" className="py-6 text-white md:py-8">
      <h2 id="forecast-heading" className="text-2xl font-bold">
        Previsão dos próximos dias
      </h2>
      {forecast.isIncomplete && <p className="mt-2 text-white/70">Previsão incompleta.</p>}
      {forecast.days.length === 0 ? (
        <p className="mt-4 text-white/70">Previsão indisponível.</p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {forecast.days.map((day) => (
            <ForecastCard key={day.localDate} day={day} unit={unit} />
          ))}
        </div>
      )}
    </section>
  );
}
