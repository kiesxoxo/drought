import { test, expect } from './fixtures.js';

// Playwright's headless Chromium hides scrollbars, which hid a list that
// overflowed by exactly a scrollbar's width. These tests show them again.
test.use({
  launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] },
  // Short enough that the list scrolls vertically
  viewport: { width: 1440, height: 400 },
});

test('a vertical scrollbar does not make the list scroll sideways', async ({
  page,
}) => {
  const fit = () =>
    page.evaluate(() => {
      const wrapper = document.querySelector('table').parentElement;
      return {
        scrollbar: wrapper.offsetWidth - wrapper.clientWidth > 0,
        overflow: wrapper.scrollWidth - wrapper.clientWidth,
      };
    });
  // Sidebar open (the default at this width) and closed
  await expect.poll(fit).toEqual({ scrollbar: true, overflow: 0 });
  await page.getByRole('button', { name: 'Toggle sidebar' }).click();
  await expect.poll(fit).toEqual({ scrollbar: true, overflow: 0 });
});
