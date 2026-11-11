import { expect, test } from '@playwright/test';

test('recupera a busca após perda de conexão', async ({ page, context }) => {
  let offline = true;
  let searchRequests = 0;
  await page.route('https://geocoding-api.open-meteo.com/v1/search?*', (route) => {
    searchRequests += 1;
    if (offline) return route.abort('internetdisconnected');
    return route.fulfill({
      json: { results: [{ id: 1, name: 'Recife', latitude: -8, longitude: -35 }] },
    });
  });
  await page.route('https://api.open-meteo.com/v1/forecast?*', (route) =>
    route.fulfill({
      json: {
        current: {},
        daily: {
          time: [],
          weather_code: [],
          temperature_2m_max: [],
          temperature_2m_min: [],
          precipitation_probability_max: [],
        },
      },
    }),
  );

  await page.goto('/');
  await context.setOffline(true);
  await page.getByRole('searchbox', { name: 'Nome da cidade' }).fill('Recife');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Verifique sua conexão');

  offline = false;
  await context.setOffline(false);
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(
    page.getByRole('region', { name: 'Clima atual' }).getByRole('heading', { name: 'Recife' }),
  ).toBeVisible();
  expect(searchRequests).toBe(2);
});

test('exibe mensagem quando o geocoding retorna um objeto sem results', async ({ page }) => {
  await page.route('https://geocoding-api.open-meteo.com/v1/search?*', (route) =>
    route.fulfill({ json: {} }),
  );
  const forecastRequests: string[] = [];
  await page.route('https://api.open-meteo.com/v1/forecast?*', (route) => {
    forecastRequests.push(route.request().url());
    return route.abort();
  });

  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Nome da cidade' }).fill('Cidade inexistente');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();

  await expect(page.getByText('Nenhuma cidade encontrada', { exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Clima atual' })).toHaveCount(0);
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(forecastRequests).toHaveLength(0);
});

test('renderiza o clima e a previsão após busca em viewport mobile de 375x812', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.route('https://geocoding-api.open-meteo.com/v1/search?*', (route) =>
    route.fulfill({
      json: {
        results: [
          {
            id: 3448439,
            name: 'São Paulo',
            admin1: 'São Paulo',
            country: 'Brasil',
            latitude: -23.5475,
            longitude: -46.6361,
            timezone: 'America/Sao_Paulo',
          },
        ],
      },
    }),
  );
  const forecastRequests: string[] = [];
  await page.route('https://api.open-meteo.com/v1/forecast?*', (route) => {
    forecastRequests.push(route.request().url());
    return route.fulfill({
      json: {
        timezone: 'America/Sao_Paulo',
        current: {
          time: '2026-11-11T09:00',
          temperature_2m: 25,
          apparent_temperature: 27,
          relative_humidity_2m: 68,
          weather_code: 0,
          wind_speed_10m: 10,
        },
        daily: {
          time: ['2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15'],
          weather_code: [0, 0, 0, 0, 0],
          temperature_2m_max: [28, 29, 30, 31, 32],
          temperature_2m_min: [18, 19, 20, 21, 22],
          precipitation_probability_max: [0, 10, 20, 30, 40],
        },
      },
    });
  });

  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Nome da cidade' }).fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();

  const current = page.getByRole('region', { name: 'Clima atual' });
  await expect(current.getByRole('heading', { name: 'São Paulo', exact: true })).toBeVisible();
  await expect(current.getByText('São Paulo, Brasil', { exact: true })).toBeVisible();
  await expect(current.getByText('25 °C', { exact: true })).toBeVisible();
  await expect(current.getByText('Céu limpo', { exact: true })).toBeVisible();
  await expect(current.getByText('Sensação térmica: 27 °C')).toBeVisible();
  await expect(current.getByText('68 %', { exact: true })).toBeVisible();
  await expect(current.getByText('10 km/h', { exact: true })).toBeVisible();
  await expect(current.getByText('Observação local: 09:00')).toBeVisible();

  const forecast = page.getByRole('region', { name: 'Previsão dos próximos dias' });
  await expect(forecast.getByRole('article')).toHaveCount(5);
  for (const day of await forecast.getByRole('article').all()) {
    await expect(day).toBeVisible();
  }
  await expect(forecast.getByRole('article').first()).toContainText('28 °C');
  await expect(forecast.getByRole('article').first()).toContainText('18 °C');

  const requestCount = forecastRequests.length;
  expect(requestCount).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Fahrenheit (°F)', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Fahrenheit (°F)' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(current.getByText('77 °F', { exact: true })).toBeVisible();
  await expect(current.getByText('Sensação térmica: 81 °F')).toBeVisible();
  await expect(forecast.getByRole('article').first()).toContainText('82 °F');
  await expect(forecast.getByRole('article').first()).toContainText('64 °F');
  expect(forecastRequests).toHaveLength(requestCount);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
