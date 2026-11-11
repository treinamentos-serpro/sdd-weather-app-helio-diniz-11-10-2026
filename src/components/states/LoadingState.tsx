export default function LoadingState() {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-8 text-white/80">
      <span
        aria-hidden="true"
        className="h-5 w-5 shrink-0 rounded-full border-2 border-white/20 border-t-accent-400 motion-safe:animate-spin"
      />
      <p>Carregando...</p>
    </div>
  );
}
