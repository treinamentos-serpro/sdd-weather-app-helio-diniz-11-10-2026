interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="space-y-4 border-y border-white/10 py-8 text-center text-white">
      <p role="alert" className="break-words text-white/80">
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="min-h-11 max-w-full rounded-lg bg-accent-500 px-4 py-2 font-semibold text-night-900 hover:bg-accent-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}
