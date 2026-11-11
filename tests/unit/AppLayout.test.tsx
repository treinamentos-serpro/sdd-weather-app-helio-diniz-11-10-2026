import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import { mockWeatherData } from '../../src/mocks/weather';
import { getWeather, searchCities, WeatherServiceError } from '../../src/services/weatherService';
import type { City } from '../../src/types/weather';

vi.mock('../../src/services/weatherService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/weatherService')>();
  return { ...actual, searchCities: vi.fn(), getWeather: vi.fn() };
});

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe('App', () => {
  it('exibe o estado inicial e busca o clima sem repetir requisições ao trocar a unidade', async () => {
    vi.mocked(searchCities).mockResolvedValue([mockWeatherData.city]);
    vi.mocked(getWeather).mockResolvedValue(mockWeatherData);
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByText('Busque uma cidade para consultar o clima.')).toBeInTheDocument();
    const results = screen.getByRole('main', { name: 'Resultados da busca' });
    expect(results).toHaveAttribute('aria-busy', 'false');
    expect(results).not.toHaveFocus();
    await user.type(screen.getByRole('searchbox', { name: 'Nome da cidade' }), 'São Paulo');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    const current = await screen.findByRole('region', { name: 'Clima atual' });
    expect(within(current).getByText('24°C')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Previsão dos próximos dias' })).toBeInTheDocument();
    expect(results).toHaveFocus();
    expect(results).toHaveAttribute('aria-busy', 'false');

    await user.click(screen.getByRole('button', { name: 'Fahrenheit (°F)' }));
    expect(screen.getByRole('button', { name: 'Fahrenheit (°F)' })).toHaveFocus();
    expect(within(current).getByText('75°F')).toBeInTheDocument();
    expect(within(current).getByText('Sensação térmica: 77°F')).toBeInTheDocument();
    expect(screen.getByText('79°F')).toBeInTheDocument();
    expect(searchCities).toHaveBeenCalledTimes(1);
    expect(getWeather).toHaveBeenCalledTimes(1);
  });

  it('mostra o estado vazio para uma busca sem resultados', async () => {
    vi.mocked(searchCities).mockResolvedValue([]);
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByRole('searchbox', { name: 'Nome da cidade' }), 'Recife');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(
      await screen.findByRole('heading', { name: 'Nenhuma cidade encontrada' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Clima atual' })).not.toBeInTheDocument();
    expect(getWeather).not.toHaveBeenCalled();
  });

  it('mostra carregamento e permite repetir a consulta meteorológica após erro', async () => {
    vi.mocked(searchCities).mockResolvedValue([mockWeatherData.city]);
    vi.mocked(getWeather)
      .mockRejectedValueOnce(new WeatherServiceError('network', 'Falha de rede.', true))
      .mockResolvedValueOnce(mockWeatherData);
    render(<App />);
    fireEvent.change(screen.getByRole('searchbox', { name: 'Nome da cidade' }), {
      target: { value: 'São Paulo' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(screen.getByText('Carregando...')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAttribute('aria-busy', 'true');
    expect(await screen.findByRole('alert')).toHaveTextContent('Falha de rede.');
    expect(screen.getByRole('main')).toHaveAttribute('aria-busy', 'false');
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(screen.getByRole('main')).toHaveAttribute('aria-busy', 'true');
    expect(await screen.findByRole('region', { name: 'Clima atual' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveFocus();
    expect(screen.getByRole('main')).toHaveAttribute('aria-busy', 'false');
    expect(searchCities).toHaveBeenCalledTimes(1);
    expect(getWeather).toHaveBeenCalledTimes(2);
  });

  it('repete a busca atual quando a geocodificação falha após uma busca anterior', async () => {
    vi.mocked(searchCities)
      .mockResolvedValueOnce([mockWeatherData.city])
      .mockRejectedValueOnce(new WeatherServiceError('network', 'Falha de rede.', true))
      .mockResolvedValueOnce([]);
    vi.mocked(getWeather).mockResolvedValue(mockWeatherData);
    const user = userEvent.setup();
    render(<App />);

    const input = screen.getByRole('searchbox', { name: 'Nome da cidade' });
    await user.type(input, 'São Paulo');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    await screen.findByRole('region', { name: 'Clima atual' });
    await user.clear(input);
    await user.type(input, 'Recife');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    await screen.findByRole('alert');
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(
      await screen.findByRole('heading', { name: 'Nenhuma cidade encontrada' }),
    ).toBeInTheDocument();
    expect(searchCities).toHaveBeenLastCalledWith('Recife');
    expect(getWeather).toHaveBeenCalledTimes(1);
  });

  it('não oferece nova tentativa para erros não recuperáveis', async () => {
    vi.mocked(searchCities).mockResolvedValue([mockWeatherData.city]);
    vi.mocked(getWeather).mockRejectedValue(
      new WeatherServiceError('invalid-location', 'Localização inválida.', false),
    );
    render(<App />);
    fireEvent.change(screen.getByRole('searchbox', { name: 'Nome da cidade' }), {
      target: { value: 'São Paulo' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Localização inválida.');
    expect(screen.queryByRole('button', { name: 'Tentar novamente' })).not.toBeInTheDocument();
  });

  it('ignora respostas de uma busca anterior', async () => {
    let resolveFirst: (cities: City[]) => void = () => {};
    vi.mocked(searchCities)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockResolvedValueOnce([]);
    render(<App />);

    const input = screen.getByRole('searchbox', { name: 'Nome da cidade' });
    fireEvent.change(input, { target: { value: 'São Paulo' } });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    fireEvent.change(input, { target: { value: 'Recife' } });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    await screen.findByRole('heading', { name: 'Nenhuma cidade encontrada' });
    await act(async () => resolveFirst([mockWeatherData.city]));

    expect(screen.getByRole('heading', { name: 'Nenhuma cidade encontrada' })).toBeInTheDocument();
    expect(getWeather).not.toHaveBeenCalled();
  });
});
