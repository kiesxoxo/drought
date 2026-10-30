import { test, expect, nextRpc, openDetails } from './fixtures.js';

const rows = (page) => page.locator('.list .row');
const folder = (page, name) =>
  page.locator('.list .row.folder', {
    has: page.locator('.text').getByText(name, { exact: true }),
  });

test('expands folders and keeps them open across refreshes', async ({
  page,
}) => {
  await openDetails(page, 'NASA Apollo Archive', 'Files');
  await expect(rows(page)).toHaveCount(8);
  await folder(page, 'Apollo 11').locator('.label').click();
  await expect(rows(page)).toHaveCount(12);
  // The details poll every second; give it a few cycles
  await page.waitForTimeout(3000);
  await expect(rows(page)).toHaveCount(12);
});

test('filters files and scopes bulk actions to the matches', async ({
  page,
}) => {
  await openDetails(page, 'NASA Apollo Archive', 'Files');
  await page.getByPlaceholder(/Filter 435 files/).fill('apollo 17 video');
  await expect(page.getByText('6 matching:')).toBeVisible();
  const want = nextRpc(page, 'torrent-set');
  await page.getByRole('button', { name: 'Download', exact: true }).click();
  const args = (await want).arguments;
  expect(args['files-wanted']).toHaveLength(6);
  await expect(page.locator('.summary .totals')).toContainText(
    '435 of 435 files wanted'
  );
});

test('toggles a folder and sets file priority', async ({ page }) => {
  await openDetails(page, 'NASA Apollo Archive', 'Files');
  const skip = nextRpc(page, 'torrent-set');
  await folder(page, 'Apollo 12').getByRole('checkbox').click();
  expect((await skip).arguments['files-unwanted']).toHaveLength(62);

  await folder(page, 'Apollo 13')
    .getByRole('button', { name: /priority/i })
    .click();
  const prio = nextRpc(page, 'torrent-set');
  await page.getByRole('menuitemradio', { name: /^High/ }).click();
  expect((await prio).arguments['priority-high']).toHaveLength(62);
  await expect(
    folder(page, 'Apollo 13').getByRole('button', { name: /priority/i })
  ).toHaveAttribute('aria-label', /High$/);
});

test('opens a 10,000-file torrent quickly with a small DOM', async ({
  page,
}) => {
  await openDetails(page, 'Weather Station Archive');
  const started = Date.now();
  await page.getByRole('tab', { name: 'Files' }).click();
  await expect(page.locator('.summary .totals')).toContainText(
    'of 10000 files wanted'
  );
  expect(Date.now() - started).toBeLessThan(3000);

  await page.getByRole('button', { name: 'Expand all' }).click();
  // Only the rows on screen are rendered, however many files there are
  expect(await rows(page).count()).toBeLessThan(80);
  await page
    .locator('.list')
    .evaluate((list) => list.scrollTo(0, list.scrollHeight));
  await expect(page.getByText('day-20.csv').last()).toBeVisible();
});
