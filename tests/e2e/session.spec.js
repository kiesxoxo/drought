import { test, expect, row, MOCK_ORIGIN } from './fixtures.js';

const rpcResponse = (page, method, status) =>
  page.waitForResponse(
    (response) =>
      response.url().includes('/transmission/rpc') &&
      response.request().postDataJSON()?.method === method &&
      response.status() === status
  );

test('page load needs only one session handshake', async ({ page }) => {
  const statuses = [];
  page.on('response', (response) => {
    if (response.url().includes('/transmission/rpc')) {
      statuses.push(response.status());
    }
  });
  await page.reload();
  await expect(page.locator('tbody tr').first()).toBeVisible();
  expect(statuses.filter((status) => status === 409)).toHaveLength(1);
});

test('calls survive a session token change', async ({ page }) => {
  // Rotate the token right as the call goes out, so polling can't pick up the
  // new one first
  let rotated = false;
  await page.route('**/transmission/rpc', async (route) => {
    if (!rotated && route.request().postDataJSON()?.method === 'torrent-stop') {
      rotated = true;
      await fetch(`${MOCK_ORIGIN}/__rotate-token`, { method: 'POST' });
    }
    await route.continue();
  });
  const rejected = rpcResponse(page, 'torrent-stop', 409);
  await row(page, 'Sintel (2010) 1080p').click({ button: 'right' });
  const stopped = rpcResponse(page, 'torrent-stop', 200);
  await page.getByRole('menuitem', { name: 'Stop' }).click();
  await rejected;
  expect((await stopped).request().postDataJSON().arguments.ids).toEqual([6]);
});
