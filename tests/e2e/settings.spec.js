import { test, expect, row, nextRpc } from './fixtures.js';

const openSettings = async (page, section) => {
  await page.getByRole('button', { name: 'Settings' }).click();
  if (section) {
    await page.getByRole('button', { name: section, exact: true }).click();
  }
  return page.getByRole('dialog');
};

test('saves torrent and speed settings to the daemon', async ({ page }) => {
  let dialog = await openSettings(page);
  await dialog.getByText('Start when added').click();
  let set = nextRpc(page, 'session-set');
  await dialog.getByRole('button', { name: 'Save settings' }).click();
  expect((await set).arguments).toHaveProperty('start-added-torrents', true);

  await page.keyboard.press('Escape');
  dialog = await openSettings(page, 'Speed');
  set = nextRpc(page, 'session-set');
  await dialog.getByRole('button', { name: 'Save settings' }).click();
  expect((await set).arguments).toHaveProperty('speed-limit-up-enabled', true);
});

test('hides a column from the user interface settings', async ({ page }) => {
  await expect(page.locator('thead th', { hasText: 'ETA' })).toHaveCount(1);
  const dialog = await openSettings(page, 'User Interface');
  await dialog
    .locator('.column', { hasText: 'ETA' })
    .getByText('Enabled')
    .click();
  await dialog.getByRole('button', { name: 'Save settings' }).click();
  await page.keyboard.press('Escape');
  await expect(page.locator('thead th', { hasText: 'ETA' })).toHaveCount(0);
});

test('labels dialog starts from the existing labels', async ({ page }) => {
  await row(page, 'Sintel (2010) 1080p').click({ button: 'right' });
  await page.getByRole('menuitem', { name: 'Set labels…' }).click();
  await expect(page.getByPlaceholder('Enter labels')).toHaveValue('open-movie');
});
