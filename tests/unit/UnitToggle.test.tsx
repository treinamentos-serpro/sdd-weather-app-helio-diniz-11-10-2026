import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import UnitToggle from '../../src/components/UnitToggle';

afterEach(cleanup);

describe('UnitToggle', () => {
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
