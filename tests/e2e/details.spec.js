import { test, expect, row, nextRpc, openDetails } from './fixtures.js';

const pane = (page) =>
  page.locator('section').filter({ has: page.getByRole('tablist') });

test('shows a hint until a torrent is selected', async ({ page }) => {
  await expect(
    page.getByText('Select a torrent to see its details')
  ).toBeVisible();
});

test('shows status and every tab for the selected torrent', async ({
  page,
}) => {
  await openDetails(page, 'Tears of Steel (2012) 4K');
  await expect(pane(page).getByRole('heading', { level: 2 })).toHaveText(
    'Tears of Steel (2012) 4K'
  );
  await expect(pane(page)).toContainText('Downloading');

  await expect(page.getByText('Download location')).toBeVisible();
  await page.getByRole('tab', { name: 'Files' }).click();
  await expect(page.locator('.summary .totals')).toContainText(
    '1 of 1 file wanted'
  );
  await page.getByRole('tab', { name: 'Peers' }).click();
  await expect(
    page.locator('[data-slot="tabs-content"][data-state="active"] tbody tr')
  ).not.toHaveCount(0);
  await page.getByRole('tab', { name: 'Trackers' }).click();
  await expect(
    page.getByText('https://tracker.opentrackr.org/announce')
  ).toBeVisible();
});

test('renames by double-clicking the title', async ({ page }) => {
  await openDetails(page, 'Sintel (2010) 1080p');
  await pane(page).getByRole('heading', { level: 2 }).dblclick();
  const input = pane(page).locator('input').first();
  await input.fill('Sintel (2010) 1080p remux');
  const rename = nextRpc(page, 'torrent-rename-path');
  await input.press('Enter');
  expect((await rename).arguments).toMatchObject({
    ids: [6],
    name: 'Sintel (2010) 1080p remux',
  });
});

test('sets torrent priority from the header', async ({ page }) => {
  await openDetails(page, 'Sintel (2010) 1080p');
  await pane(page)
    .getByRole('button', { name: /^Torrent priority/ })
    .click();
  const set = nextRpc(page, 'torrent-set');
  await page.getByRole('menuitemradio', { name: /^Low/ }).click();
  expect((await set).arguments).toMatchObject({
    ids: [6],
    bandwidthPriority: -1,
  });
});

test('Enter reopens a collapsed details pane', async ({ page }) => {
  await row(page, 'Sintel (2010) 1080p').click();
  const handle = await page
    .locator('[data-slot="resizable-handle"]')
    .boundingBox();
  await page.mouse.move(handle.x + 300, handle.y + handle.height / 2);
  await page.mouse.down();
  await page.mouse.move(handle.x + 300, 895, { steps: 10 });
  await page.mouse.up();
  // A collapsed pane is clipped to zero height rather than removed
  const paneHeight = () =>
    page.evaluate(() =>
      Math.round(
        [...document.querySelectorAll('[data-pane]')]
          .at(-1)
          .getBoundingClientRect().height
      )
    );
  await expect.poll(paneHeight).toBeLessThan(2);
  await page.keyboard.press('Enter');
  await expect.poll(paneHeight).toBeGreaterThan(200);
});
