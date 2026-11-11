import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import CurrentWeather from '../../src/components/CurrentWeather';
import { formatTemperature } from '../../src/lib/temperature';
import { getWeatherInfo } from '../../src/lib/weatherCodes';
import { mockWeatherData } from '../../src/mocks/weather';

afterEach(cleanup);

describe('CurrentWeather', () => {
  it('apresenta a cidade, condição, observação e métricas disponíveis', () => {
    const current = { ...mockWeatherData.current!, precipitationMm: 0, pressureHpa: 1013 };
    render(<CurrentWeather city={mockWeatherData.city} current={current} unit="celsius" />);

    const section = screen.getByRole('region', { name: 'Clima atual' });
    expect(within(section).getByRole('heading', { name: 'São Paulo' })).toBeInTheDocument();
    expect(within(section).getByText('24°C')).toBeInTheDocument();
    expect(within(section).getByText('Parcialmente nublado')).toBeInTheDocument();
    expect(within(section).getByText('Sensação térmica: 25°C')).toBeInTheDocument();
    expect(within(section).getByText('Observação local: 12:00')).toBeInTheDocument();
    expect(within(section).getByText('68 %')).toBeInTheDocument();
    expect(within(section).getByText('12 km/h')).toBeInTheDocument();
    expect(within(section).getByText('0 mm')).toBeInTheDocument();
    expect(within(section).getByText('1013 hPa')).toBeInTheDocument();
  });

  it('atualiza temperaturas na unidade escolhida', () => {
    const current = { ...mockWeatherData.current!, temperatureC: 0, feelsLikeC: 25 };
    const { rerender } = render(
      <CurrentWeather city={mockWeatherData.city} current={current} unit="celsius" />,
    );
    rerender(<CurrentWeather city={mockWeatherData.city} current={current} unit="fahrenheit" />);
    expect(screen.getByText('32°F')).toBeInTheDocument();
    expect(screen.getByText('Sensação térmica: 77°F')).toBeInTheDocument();
    expect(formatTemperature(-0.5, 'celsius')).toBe('-1°C');
    expect(formatTemperature(-40, 'fahrenheit')).toBe('-40°F');
  });

  it('identifica dados ausentes e condição desconhecida sem presumir fuso', () => {
    const current = {
      temperatureC: null,
      feelsLikeC: null,
      humidityPercent: null,
      windSpeedKmh: null,
      observedAt: '2026-11-11T12:00',
      conditionCode: null,
    };
    const city = { ...mockWeatherData.city, timezone: undefined };
    render(<CurrentWeather city={city} current={current} unit="celsius" />);
    expect(screen.getByText('Condição indisponível')).toBeInTheDocument();
    expect(screen.getByText('Observação local: Indisponível')).toBeInTheDocument();
    expect(screen.getAllByText('Indisponível')).toHaveLength(5);
    expect(getWeatherInfo(999).label).toBe('Condição indisponível');
  });

  it('converte horários com offset para o fuso da cidade e rejeita datas inválidas', () => {
    const current = { ...mockWeatherData.current!, observedAt: '2026-11-11T15:00:00Z' };
    const { rerender } = render(
      <CurrentWeather city={mockWeatherData.city} current={current} unit="celsius" />,
    );
    expect(screen.getByText('Observação local: 12:00')).toBeInTheDocument();
    rerender(
      <CurrentWeather
        city={mockWeatherData.city}
        current={{ ...current, observedAt: '2026-02-30T12:00' }}
        unit="celsius"
      />,
    );
    expect(screen.getByText('Observação local: Indisponível')).toBeInTheDocument();
  });
});
