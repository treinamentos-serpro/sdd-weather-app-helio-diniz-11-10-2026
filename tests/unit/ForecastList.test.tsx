import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import ForecastList from '../../src/components/ForecastList';
import { formatForecastDay } from '../../src/lib/format';
import { mockWeatherData } from '../../src/mocks/weather';

afterEach(cleanup);

describe('ForecastList', () => {
  it('apresenta os dias recebidos em ordem com condição e dados meteorológicos', () => {
    render(<ForecastList forecast={mockWeatherData.forecast!} unit="celsius" />);

    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(5);
    expect(
      within(cards[0]).getByRole('heading', { name: /quarta-feira.*11\/11\/2026/i }),
    ).toBeInTheDocument();
    expect(within(cards[0]).getByText('Parcialmente nublado')).toBeInTheDocument();
    expect(within(cards[0]).getByText('26°C')).toBeInTheDocument();
    expect(within(cards[0]).getByText('18°C')).toBeInTheDocument();
    expect(within(cards[0]).getByText('20%')).toBeInTheDocument();
    expect(within(cards[4]).getByRole('heading', { name: /15\/11\/2026/ })).toBeInTheDocument();
  });

  it('atualiza as temperaturas quando a unidade muda', () => {
    const forecast = mockWeatherData.forecast!;
    const { rerender } = render(<ForecastList forecast={forecast} unit="celsius" />);
    rerender(<ForecastList forecast={forecast} unit="fahrenheit" />);
    const firstCard = screen.getAllByRole('article')[0];
    expect(within(firstCard).getByText('79°F')).toBeInTheDocument();
    expect(within(firstCard).getByText('64°F')).toBeInTheDocument();
  });

  it('sinaliza previsão incompleta e campos ausentes sem inventar dias', () => {
    const day = {
      localDate: '2026-02-30',
      conditionCode: null,
      minimumC: null,
      maximumC: null,
      precipitationProbabilityPercent: null,
    };
    render(<ForecastList forecast={{ days: [day], isIncomplete: true }} unit="celsius" />);
    expect(screen.getByText('Previsão incompleta.')).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(screen.getByRole('heading', { name: 'Data indisponível' })).toBeInTheDocument();
    expect(screen.getByText('Condição indisponível')).toBeInTheDocument();
    expect(screen.getAllByText('Indisponível')).toHaveLength(3);
  });

  it('informa quando não há dias disponíveis', () => {
    render(<ForecastList forecast={{ days: [], isIncomplete: true }} unit="celsius" />);
    expect(screen.getByText('Previsão indisponível.')).toBeInTheDocument();
    expect(screen.queryAllByRole('article')).toHaveLength(0);
  });

  it('rejeita datas inválidas sem depender do fuso do dispositivo', () => {
    expect(formatForecastDay('2026-11-11')).toMatch(/quarta-feira.*11\/11\/2026/i);
    expect(formatForecastDay('2026-02-29')).toBe('Data indisponível');
    expect(formatForecastDay('2026-11-11T00:00:00Z')).toBe('Data indisponível');
  });
});
