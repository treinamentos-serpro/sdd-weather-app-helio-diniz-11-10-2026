import { type KeyboardEvent, useRef } from 'react';
import type { Unit } from '../types/weather';

interface UnitToggleProps {
  unit: Unit;
  onChange: (unit: Unit) => void;
}

const units: { value: Unit; label: string; accessibleLabel: string }[] = [
  { value: 'celsius', label: '°C', accessibleLabel: 'Celsius (°C)' },
  { value: 'fahrenheit', label: '°F', accessibleLabel: 'Fahrenheit (°F)' },
];

export default function UnitToggle({ unit, onChange }: UnitToggleProps) {
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | undefined;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (index + 1) % units.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (index + units.length - 1) % units.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = units.length - 1;
    }

    if (nextIndex === undefined) return;

    event.preventDefault();
    buttonRefs.current[nextIndex]?.focus();
    const nextUnit = units[nextIndex].value;
    if (nextUnit !== unit) onChange(nextUnit);
  }

  return (
    <div
      role="group"
      aria-label="Unidade de temperatura"
      className="inline-flex rounded-md border border-white/10 bg-white/5 p-1"
    >
      {units.map(({ value, label, accessibleLabel }, index) => (
        <button
          key={value}
          ref={(element) => {
            buttonRefs.current[index] = element;
          }}
          type="button"
          aria-label={accessibleLabel}
          aria-pressed={unit === value}
          tabIndex={unit === value ? 0 : -1}
          onClick={() => {
            if (unit !== value) onChange(value);
          }}
          onKeyDown={(event) => handleKeyDown(event, index)}
          className="min-h-11 min-w-11 rounded px-3 text-sm font-semibold text-white/75 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 aria-pressed:bg-accent-500 aria-pressed:text-night-900 aria-pressed:hover:text-night-900"
        >
          {label}
        </button>
      ))}
    </div>
  );
}
