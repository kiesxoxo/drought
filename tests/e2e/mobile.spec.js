import { test, expect, row, nextRpc } from './fixtures.js';

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

test('phones open details in a full-screen window', async ({ page }) => {
  await row(page, 'Tears of Steel (2012) 4K').click();
  await page.getByRole('button', { name: 'Details' }).click();
  const dialog = page.getByRole('dialog');
  await expect(
    dialog.getByRole('heading', { name: 'Tears of Steel (2012) 4K' })
  ).toBeVisible();

  for (const tab of ['Files', 'Peers', 'Trackers', 'Details']) {
    await dialog.getByRole('link', { name: tab }).click();
  }
  await expect(dialog.getByText('Download location')).toBeVisible();

  const stop = nextRpc(page, 'torrent-stop');
  await dialog.getByText('Stop', { exact: true }).click();
  expect((await stop).arguments.ids).toEqual([7]);

  await dialog.getByRole('button', { name: /^Torrent priority/ }).click();
  const prio = nextRpc(page, 'torrent-set');
  await page.getByRole('menuitemradio', { name: /^High/ }).click();
  expect((await prio).arguments).toMatchObject({
    ids: [7],
    bandwidthPriority: 1,
  });

  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
});
