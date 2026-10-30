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

test('sorts by clicking a column header', async ({ page }) => {
  const names = () => page.locator('tbody tr td:first-child').allInnerTexts();
  // Same comparison as the torrents store: lowercase, by code point
  const byName = (a, b) =>
    a.toLowerCase() < b.toLowerCase()
      ? -1
      : a.toLowerCase() > b.toLowerCase()
        ? 1
        : 0;

  await page.locator('thead th', { hasText: 'Name' }).click();
  const first = await names();
  const sorted = [...first].sort(byName);
  expect([sorted, [...sorted].reverse()]).toContainEqual(first);

  await page.locator('thead th', { hasText: 'Name' }).click();
  expect(await names()).toEqual([...first].reverse());
});

test('double-click opens the details', async ({ page }) => {
  await row(page, 'Sintel (2010) 1080p').dblclick();
  await expect(
    page.getByRole('heading', { level: 2, name: 'Sintel (2010) 1080p' })
  ).toBeVisible();
});

test('cells update as the daemon reports new values', async ({ page }) => {
  // The mock varies transfer rates on every poll
  const speed = row(page, 'NASA Apollo Archive').locator('td').nth(3);
  const first = await speed.innerText();
  await expect.poll(() => speed.innerText(), { timeout: 5000 }).not.toBe(first);
});
