import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import EmptyState from '../../src/components/states/EmptyState';
import ErrorState from '../../src/components/states/ErrorState';
import LoadingState from '../../src/components/states/LoadingState';

afterEach(cleanup);

describe('Estados de feedback', () => {
  it('anuncia o carregamento com uma mensagem em pt-BR', () => {
    render(<LoadingState />);

    expect(screen.getByRole('status')).toHaveTextContent('Carregando...');
  });

  it('apresenta o erro e executa somente o callback ao clicar em tentar novamente', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorState message="Falha ao consultar o clima." onRetry={onRetry} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Falha ao consultar o clima.');
    expect(onRetry).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('permite tentar novamente pelo teclado sem submeter um formulário', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <ErrorState message="Falha de conexão." onRetry={onRetry} />
      </form>,
    );

    await user.tab();
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('exibe um título e orientação para uma busca sem resultados', () => {
    render(<EmptyState />);

    const status = screen.getByRole('status');
    expect(within(status).getByRole('heading', { name: 'Nenhum local encontrado' })).toBeVisible();
    expect(status).toHaveTextContent('Revise o nome da cidade e tente outra busca.');
  });

  it('aceita título e dica específicos para o estado vazio', () => {
    render(<EmptyState title="Nenhuma cidade corresponde ao termo" hint="Confira a grafia." />);

    expect(
      screen.getByRole('heading', { name: 'Nenhuma cidade corresponde ao termo' }),
    ).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent('Confira a grafia.');
  });
});
