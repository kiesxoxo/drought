import { test, expect, row, nextRpc } from './fixtures.js';

test('right-click selects the row and runs actions', async ({ page }) => {
  await row(page, 'Sintel (2010) 1080p').click({ button: 'right' });
  await expect(page.getByRole('menu')).toBeVisible();
  await expect(page.locator('tbody tr.selected')).toHaveCount(1);

  const stop = nextRpc(page, 'torrent-stop');
  await page.getByRole('menuitem', { name: 'Stop' }).click();
  expect((await stop).arguments.ids).toEqual([6]);
});

test('priority submenu sets torrent priority', async ({ page }) => {
  await row(page, 'Sintel (2010) 1080p').click({ button: 'right' });
  await page.getByRole('menuitem', { name: 'Priority' }).hover();
  const set = nextRpc(page, 'torrent-set');
  await page.getByRole('menuitemradio', { name: 'High' }).click();
  expect((await set).arguments).toMatchObject({
    ids: [6],
    bandwidthPriority: 1,
  });
  await expect(page.getByRole('menu')).toHaveCount(0);
});

test('Escape closes the menu but keeps the selection', async ({ page }) => {
  await row(page, 'Sintel (2010) 1080p').click({ button: 'right' });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toHaveCount(0);
  await expect(page.locator('tbody tr.selected')).toHaveCount(1);
});
