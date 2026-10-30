import { test, expect } from './fixtures.js';

const sidebar = (page) => page.locator('.panel');
test('status filters narrow the list', async ({ page }) => {
  await sidebar(page)
    .locator('li', { hasText: /^\s*Downloading\s*\d+\s*$/ })
    .click();
  await expect(page.locator('tbody tr')).toHaveCount(3);
  await sidebar(page)
    .locator('li', { hasText: /^\s*Seeding\s*\d+\s*$/ })
    .click();
  await expect(page.locator('tbody tr')).toHaveCount(7);
  await sidebar(page)
    .locator('li', { hasText: /^\s*All\s*\d+\s*$/ })
    .first()
    .click();
  await expect(page.locator('tbody tr')).toHaveCount(14);
});

test('label filters, including ones behind "Show all"', async ({ page }) => {
  const labels = sidebar(page)
    .locator('h2', { hasText: 'Filter by label' })
    .locator('xpath=following-sibling::ul[1]');
  await labels.locator('li', { hasText: /^linux\s*\d+$/ }).click();
  await expect(page.locator('tbody tr')).toHaveCount(4);

  await labels.getByText('Show all...').click();
  await labels.locator('li', { hasText: /^open-movie\s*\d+$/ }).click();
  await expect(page.locator('tbody tr')).toHaveCount(4);
  await labels.getByText('Hide some...').click();
  // The selected label stays visible with its own count
  await expect(labels.locator('li', { hasText: /^open-movie/ })).toHaveText(
    /open-movie\s*4$/
  );
});

test('the speed graph shows the current rates', async ({ page }) => {
  await expect(sidebar(page).locator('.speed--download')).toContainText(
    /MB\/s/
  );
  await expect(sidebar(page).locator('.speed--upload')).toContainText(
    /[kM]B\/s/
  );
});
