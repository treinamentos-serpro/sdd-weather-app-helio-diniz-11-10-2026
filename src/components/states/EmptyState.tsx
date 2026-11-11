interface EmptyStateProps {
  title?: string;
  hint?: string;
}

export default function EmptyState({
  title = 'Nenhum local encontrado',
  hint = 'Revise o nome da cidade e tente outra busca.',
}: EmptyStateProps) {
  return (
    <div role="status" className="space-y-2 border-y border-white/10 py-8 text-center text-white">
      <h2 className="break-words text-lg font-semibold">{title}</h2>
      <p className="break-words text-white/70">{hint}</p>
    </div>
  );
}
