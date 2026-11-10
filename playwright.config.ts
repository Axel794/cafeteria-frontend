import { defineConfig, devices } from '@playwright/test';

/**
 * Pruebas de integracion Angular + Spring Boot (Practica de Campo 5).
 * Requieren el backend en http://localhost:8080. Si el frontend no esta corriendo,
 * Playwright lo levanta con `npm start`.
 *
 *   npm run e2e            -> ejecuta todo
 *   npm run e2e:informe    -> abre el informe HTML con capturas y trazas
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  outputDir: 'e2e-resultados',
  use: {
    baseURL: 'http://localhost:4200',
    viewport: { width: 1280, height: 800 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm start',
    url: 'http://localhost:4200',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
