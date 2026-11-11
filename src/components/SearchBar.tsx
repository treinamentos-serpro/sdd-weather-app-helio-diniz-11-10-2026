import { type FormEvent, useId, useRef, useState } from 'react';

interface SearchBarProps {
  onSearch: (city: string) => void;
  disabled?: boolean;
}

export default function SearchBar({ onSearch, disabled = false }: SearchBarProps) {
  const [city, setCity] = useState('');
  const [hasError, setHasError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const errorId = useId();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (disabled) return;

    const trimmedCity = city.trim();
    if (!trimmedCity) {
      setHasError(true);
      inputRef.current?.focus();
      return;
    }

    setHasError(false);
    onSearch(trimmedCity);
  }

  return (
    <form role="search" onSubmit={handleSubmit} noValidate className="w-full">
      <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-white">
        Nome da cidade
      </label>
      <div className="flex gap-2 rounded-lg border border-white/10 bg-white/5 p-2 backdrop-blur-md">
        <input
          ref={inputRef}
          id={inputId}
          type="search"
          value={city}
          onChange={(event) => {
            setCity(event.target.value);
            if (hasError) setHasError(false);
          }}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : undefined}
          placeholder="Ex.: São Paulo"
          className="min-h-11 min-w-0 flex-1 rounded-md bg-transparent px-3 py-2 text-white placeholder:text-white/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled}
          className="min-h-11 rounded-md bg-accent-500 px-4 py-2 font-medium text-night-900 enabled:hover:bg-accent-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Buscar
        </button>
      </div>
      {hasError && (
        <p id={errorId} role="alert" className="mt-2 text-sm text-red-300">
          Informe o nome da cidade.
        </p>
      )}
    </form>
  );
}
