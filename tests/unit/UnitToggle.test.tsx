import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CurrentWeather from '../../src/components/CurrentWeather';
import UnitToggle from '../../src/components/UnitToggle';
import { mockWeatherData } from '../../src/mocks/weather';
import type { Unit } from '../../src/types/weather';

afterEach(cleanup);

describe('UnitToggle', () => {
  it('atualiza a temperatura atual ao selecionar Fahrenheit', async () => {
    function WeatherWithUnitToggle() {
      const [unit, setUnit] = useState<Unit>('celsius');
      const current = { ...mockWeatherData.current!, temperatureC: 0 };

      return (
        <>
          <UnitToggle unit={unit} onChange={setUnit} />
          <CurrentWeather city={mockWeatherData.city} current={current} unit={unit} />
        </>
      );
    }

    const user = userEvent.setup();
    render(<WeatherWithUnitToggle />);

    const weather = screen.getByRole('region', { name: 'Clima atual' });
    expect(within(weather).getByText('0°C')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Fahrenheit (°F)' }));
    expect(within(weather).getByText('32°F')).toBeInTheDocument();
  });

  it('indica a unidade ativa e chama onChange ao selecionar outra unidade', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<UnitToggle unit="celsius" onChange={onChange} />);

    expect(screen.getByRole('group', { name: 'Unidade de temperatura' })).toBeInTheDocument();
    const celsiusButton = screen.getByRole('button', { name: 'Celsius (°C)' });
    const fahrenheitButton = screen.getByRole('button', { name: 'Fahrenheit (°F)' });
    expect(celsiusButton).toHaveAttribute('aria-pressed', 'true');
    expect(fahrenheitButton).toHaveAttribute('aria-pressed', 'false');

    await user.click(fahrenheitButton);
    expect(onChange).toHaveBeenCalledExactlyOnceWith('fahrenheit');
  });

  it('navega e seleciona com as setas, Home e End', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<UnitToggle unit="celsius" onChange={onChange} />);

    const celsiusButton = screen.getByRole('button', { name: 'Celsius (°C)' });
    const fahrenheitButton = screen.getByRole('button', { name: 'Fahrenheit (°F)' });
    celsiusButton.focus();

    await user.keyboard('{ArrowRight}');
    expect(fahrenheitButton).toHaveFocus();
    expect(onChange).toHaveBeenLastCalledWith('fahrenheit');
    rerender(<UnitToggle unit="fahrenheit" onChange={onChange} />);

    await user.keyboard('{Home}');
    expect(celsiusButton).toHaveFocus();
    expect(onChange).toHaveBeenLastCalledWith('celsius');
    rerender(<UnitToggle unit="celsius" onChange={onChange} />);

    await user.keyboard('{End}');
    expect(fahrenheitButton).toHaveFocus();
    expect(onChange).toHaveBeenLastCalledWith('fahrenheit');
  });
});
