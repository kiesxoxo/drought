import { test as base, expect } from '@playwright/test';

export const MOCK_ORIGIN = 'http://localhost:8097';

// Every test starts from fresh mock data with the app loaded and the torrent
// list rendered. External lookups are stubbed so tests never hit the network.
export const test = base.extend({
  page: async ({ page }, use) => {
    await fetch(`${MOCK_ORIGIN}/__reset`, { method: 'POST' });
    await page.route('**/get.geojs.io/**', (route) =>
      route.fulfill({ json: [] })
    );
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.stack ?? error.message));
    await page.goto('./');
    await expect(page.locator('tbody tr').first()).toBeVisible();
    await use(page);
    expect(errors, 'uncaught page errors').toEqual([]);
  },
});

export { expect };

export const row = (page, name) =>
  page.locator('tbody tr', {
    has: page.getByText(name, { exact: true }),
  });

// Resolves with the parsed body of the next RPC call using `method`
export const nextRpc = (page, method) =>
  page
    .waitForRequest(
      (request) =>
        request.url().includes('/transmission/rpc') &&
        request.postDataJSON()?.method === method
    )
    .then((request) => request.postDataJSON());

export const openDetails = async (page, name, tab) => {
  await row(page, name).click();
  if (tab) await page.getByRole('tab', { name: tab }).click();
};
