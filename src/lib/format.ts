const forecastDayFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'UTC',
  weekday: 'long',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const weekdayFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'UTC',
  weekday: 'long',
});

export function formatForecastDay(localDate: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(localDate)) return 'Data indisponível';

  const date = new Date(`${localDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== localDate) {
    return 'Data indisponível';
  }

  return forecastDayFormatter.format(date);
}

export function getShortDate(localDate: string, index: number): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(localDate)) return 'Data indisponível';

  const date = new Date(`${localDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== localDate) {
    return 'Data indisponível';
  }

  if (index === 0) return 'Hoje';
  if (index === 1) return 'Amanhã';

  return weekdayFormatter.format(date);
}
