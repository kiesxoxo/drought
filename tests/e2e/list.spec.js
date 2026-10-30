import { test, expect, row } from './fixtures.js';

const TOTAL = 14;
const selected = (page) => page.locator('tbody tr.selected');

test('lists every torrent with its status', async ({ page }) => {
  await expect(page.locator('tbody tr')).toHaveCount(TOTAL);
  await expect(page.locator('footer')).toContainText(`${TOTAL} torrents`);
  await expect(
    row(page, 'Tears of Steel (2012) 4K').locator('.progress-renderer')
  ).toHaveAttribute('title', /^Downloading · 34%/);
  await expect(
    row(page, 'Sintel (2010) 1080p').locator('.progress-renderer')
  ).toHaveAttribute('title', 'Seeding · 100%');
});

test('selects with click, ctrl-click and shift-click', async ({ page }) => {
  await row(page, 'Sintel (2010) 1080p').click();
  await expect(selected(page)).toHaveCount(1);

  await row(page, 'Tears of Steel (2012) 4K').click({ modifiers: ['Control'] });
  await expect(selected(page)).toHaveCount(2);
  await expect(page.locator('footer')).toContainText('2 selected');

  await row(page, 'Sintel (2010) 1080p').click();
  await row(page, 'Big Buck Bunny (2008) 4K 60fps').click({
    modifiers: ['Shift'],
  });
  expect(await selected(page).count()).toBeGreaterThan(1);
});

test('keyboard shortcuts move, clear and search', async ({ page }) => {
  await page.keyboard.press('ArrowDown');
  await expect(selected(page)).toHaveCount(1);
  await page.keyboard.press('Shift+ArrowDown');
  await expect(selected(page)).toHaveCount(2);
  await page.keyboard.press('Escape');
  await expect(selected(page)).toHaveCount(0);

  await page.keyboard.press('/');
  await expect(page.getByPlaceholder('Search torrents')).toBeFocused();
  await page.keyboard.type('ubuntu');
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await expect(page.locator('footer')).toContainText(`1 of ${TOTAL} torrents`);
});

test('toolbar actions follow the selection', async ({ page }) => {
  const stop = page
    .locator('header')
    .getByRole('button', { name: 'Stop', exact: true });
  await expect(stop).toBeDisabled();
  await row(page, 'Tears of Steel (2012) 4K').click();
  await expect(stop).toBeEnabled();
});
