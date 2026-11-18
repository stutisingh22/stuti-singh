// Acceptance tests. Run `npx playwright install chromium` once, then `npm test`.
const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests',
  timeout: 240000,
  workers: 1,               // WebGL is heavy in headless browsers; one at a time is faster overall
  use: { baseURL: 'http://localhost:8765', screenshot: 'only-on-failure' },
  webServer: { command: 'npx --yes http-server -p 8765 -c-1 -s .', url: 'http://localhost:8765', reuseExistingServer: true, timeout: 30000 },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }]
});
