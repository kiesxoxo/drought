import { test, expect, row, nextRpc } from './fixtures.js';

test('adds a torrent by magnet link', async ({ page }) => {
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page
    .getByPlaceholder('Torrent URL, Magnet Link or hash')
    .fill('magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567');
  const add = nextRpc(page, 'torrent-add');
  await page.getByRole('button', { name: 'Add Torrent' }).click();
  expect((await add).arguments).toMatchObject({
    'filename': 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567',
    'download-dir': '/downloads',
  });
});

test('removes the selection with Delete', async ({ page }) => {
  await row(page, 'Sintel (2010) 1080p').click();
  await page.keyboard.press('Delete');
  await expect(
    page.getByText('Are you sure you want to remove 1 torrent?')
  ).toBeVisible();
  const remove = nextRpc(page, 'torrent-remove');
  await page.getByRole('button', { name: 'Remove torrent' }).click();
  expect((await remove).arguments).toMatchObject({
    'ids': [6],
    'delete-local-data': false,
  });
});

test('sets labels and location from the right-click menu', async ({ page }) => {
  await row(page, 'Sintel (2010) 1080p').click({ button: 'right' });
  await page.getByRole('menuitem', { name: 'Set labels…' }).click();
  await page.getByPlaceholder('Enter labels').fill('movies, favourite');
  const labels = nextRpc(page, 'torrent-set');
  await page.getByRole('button', { name: 'Set labels' }).click();
  expect((await labels).arguments.labels).toEqual(['movies', 'favourite']);

  await row(page, 'Sintel (2010) 1080p').click({ button: 'right' });
  await page.getByRole('menuitem', { name: 'Set location…' }).click();
  await page.getByLabel('Torrent location').fill('/downloads/Films');
  const move = nextRpc(page, 'torrent-set-location');
  await page.getByRole('button', { name: 'Set torrent location' }).click();
  expect((await move).arguments).toMatchObject({
    ids: [6],
    location: '/downloads/Films',
  });
});

test('settings pages open and save', async ({ page }) => {
  await page.getByRole('button', { name: 'Settings' }).click();
  for (const name of [
    'Speed',
    'Peers',
    'Network',
    'User Interface',
    'About',
    'Torrents',
  ]) {
    await page.getByRole('button', { name, exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  }
  await expect(page.getByText('Download to')).toBeVisible();
});

test('status bar changes speed limits and alternative speeds', async ({
  page,
}) => {
  await page.locator('footer button[title="Download speed limit"]').click();
  const limit = nextRpc(page, 'session-set');
  await page.getByRole('menuitemradio', { name: '500 kB/s' }).click();
  expect((await limit).arguments).toMatchObject({
    'speed-limit-down-enabled': true,
    'speed-limit-down': 500,
  });

  const alt = nextRpc(page, 'session-set');
  await page.getByRole('button', { name: /Alternative speed limits/ }).click();
  expect((await alt).arguments).toEqual({ 'alt-speed-enabled': true });
});

test('toggles dark mode', async ({ page }) => {
  const html = page.locator('html');
  const wasDark = await html.evaluate((el) => el.classList.contains('dark'));
  await page
    .getByRole('button', { name: wasDark ? 'Light mode' : 'Dark mode' })
    .click();
  await expect(html).toHaveClass(wasDark ? /^(?!.*\bdark\b)/ : /\bdark\b/);
});

test('the speed graph does not move the layout on hover', async ({ page }) => {
  const filters = page.getByText('Filter by status');
  const before = await filters.boundingBox();
  const graph = await page.locator('svg.graph').boundingBox();
  await page.mouse.move(graph.x + graph.width / 2, graph.y + 60);
  await expect(page.locator('.timestamp')).not.toHaveClass(/hidden/);
  expect(await filters.boundingBox()).toEqual(before);
});

test('add dialog splits pasted links and adds more fields', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  const field = page.getByPlaceholder('Torrent URL, Magnet Link or hash');
  await field.first().focus();
  await page.evaluate(() => {
    const data = new DataTransfer();
    data.setData('text', 'magnet:?xt=urn:btih:aaa\nmagnet:?xt=urn:btih:bbb');
    document.activeElement.dispatchEvent(
      new ClipboardEvent('paste', { clipboardData: data, bubbles: true })
    );
  });
  await expect(field).toHaveCount(2);
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Add', exact: true }).last().click();
  await expect(field).toHaveCount(3);
  await dialog.getByRole('button', { name: 'Remove' }).first().click();
  await expect(field).toHaveCount(2);

  await page.getByText('By File').click();
  await expect(
    page.getByText('Drop some files here, or click to browse.')
  ).toBeVisible();
});
