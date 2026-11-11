import { useState } from 'react';
import CurrentWeather from './components/CurrentWeather';
import ForecastList from './components/ForecastList';
import SearchBar from './components/SearchBar';
import EmptyState from './components/states/EmptyState';
import ErrorState from './components/states/ErrorState';
import LoadingState from './components/states/LoadingState';
import UnitToggle from './components/UnitToggle';
import { useWeather } from './hooks/useWeather';
import type { Unit } from './types/weather';

export default function App() {
  const [unit, setUnit] = useState<Unit>('celsius');
  const { state, search, retry } = useWeather();

  return (
    <div className="min-h-screen bg-night-900 font-sans text-white">
      <header className="border-b border-white/10 bg-night-800">
        <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto] items-end gap-5 px-4 py-6 sm:px-6 md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-8 lg:px-8">
          <h1 className="order-1 self-center text-xl font-bold">Weather App</h1>
          <div className="order-3 col-span-2 min-w-0 md:order-2 md:col-span-1">
            <SearchBar onSearch={search} />
          </div>
          <div className="order-2 md:order-3">
            <UnitToggle unit={unit} onChange={setUnit} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {state.status === 'idle' && (
          <p role="status" className="border-y border-white/10 py-8 text-center text-white/70">
            Busque uma cidade para consultar o clima.
          </p>
        )}
        {state.status === 'loading' && <LoadingState />}
        {state.status === 'empty' && <EmptyState title={state.message} />}
        {state.status === 'error' && <ErrorState message={state.error.message} onRetry={retry} />}
        {state.status === 'success' && (
          <>
            {state.data.current && (
              <CurrentWeather city={state.data.city} current={state.data.current} unit={unit} />
            )}
            {!state.data.current && <p className="py-6 text-white/70">Clima atual indisponível.</p>}
            {state.data.forecast && <ForecastList forecast={state.data.forecast} unit={unit} />}
            {!state.data.forecast && <p className="py-6 text-white/70">Previsão indisponível.</p>}
          </>
        )}
      </main>
    </div>
  );
}
