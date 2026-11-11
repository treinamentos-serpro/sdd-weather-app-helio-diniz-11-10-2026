import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SearchBar from '../../src/components/SearchBar';

afterEach(cleanup);

describe('SearchBar', () => {
  it('envia a cidade sem espaços nas extremidades apenas ao submeter', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    expect(screen.getByRole('search')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Nome da cidade'), '  São Paulo  ');
    expect(onSearch).not.toHaveBeenCalled();
    await user.keyboard('{Enter}');
    expect(onSearch).toHaveBeenCalledExactlyOnceWith('São Paulo');
  });

  it('valida termos vazios e mantém o foco no campo', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    const input = screen.getByLabelText('Nome da cidade');
    await user.type(input, '   ');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(onSearch).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Informe o nome da cidade.');
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute('aria-invalid', 'true');

    await user.type(input, 'Recife');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(onSearch).toHaveBeenCalledExactlyOnceWith('Recife');
  });

  it('desabilita o campo e o envio', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} disabled />);

    expect(screen.getByLabelText('Nome da cidade')).toBeDisabled();
    const button = screen.getByRole('button', { name: 'Buscar' });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onSearch).not.toHaveBeenCalled();
  });
});
