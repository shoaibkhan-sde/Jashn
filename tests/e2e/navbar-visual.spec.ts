import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Navbar Visual, Responsive & Accessibility Conformance', () => {
  const VIEWPORTS = [
    { name: '1920px (Desktop wide)', width: 1920, height: 1080 },
    { name: '1024px (Tablet/Desktop)', width: 1024, height: 768 },
    { name: '390px (Mobile)', width: 390, height: 844 },
  ];

  for (const vp of VIEWPORTS) {
    test(`renders correctly at ${vp.width}px with menu closed`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/', { waitUntil: 'networkidle' });

      const header = page.locator('header').first();
      await expect(header).toBeVisible();

      // Check brand logo and wordmark
      await expect(header.getByText('Jashn')).toBeVisible();

      // Check active page state
      if (vp.width > 820) {
        const overviewLink = header.getByRole('link', { name: 'Overview' });
        await expect(overviewLink).toBeVisible();
        await expect(overviewLink).toHaveAttribute('aria-current', 'page');
      }

      // Check language button
      const langBtn = header.getByTestId('lang-switcher');
      await expect(langBtn).toBeVisible();
      await expect(langBtn).toHaveAttribute('aria-expanded', 'false');

      // Tagline visibility
      const tagline = header.getByText('GenAI Celebration Planner');
      if (vp.width <= 1100) {
        await expect(tagline).not.toBeVisible();
      } else {
        await expect(tagline).toBeVisible();
      }

      // Capture screenshot with menu closed
      await page.screenshot({
        path: `tests/e2e/screenshots/navbar-${vp.width}-closed.png`,
        clip: { x: 0, y: 0, width: vp.width, height: 120 },
      });
    });

    test(`renders dropdown menu properly when opened at ${vp.width}px`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/', { waitUntil: 'networkidle' });

      const header = page.locator('header').first();
      const langBtn = header.getByTestId('lang-switcher');

      // Open menu
      await langBtn.click();
      await expect(langBtn).toHaveAttribute('aria-expanded', 'true');

      const menu = header.getByRole('menu');
      await expect(menu).toBeVisible();

      // All 3 language options visible
      await expect(menu.getByRole('menuitemradio', { name: /English/i })).toBeVisible();
      await expect(menu.getByRole('menuitemradio', { name: /हिन्दी/i })).toBeVisible();
      await expect(menu.getByRole('menuitemradio', { name: /मराठी/i })).toBeVisible();

      // Capture screenshot with menu open
      await page.screenshot({
        path: `tests/e2e/screenshots/navbar-${vp.width}-open.png`,
        clip: { x: 0, y: 0, width: vp.width, height: 260 },
      });
    });
  }

  test('reports zero axe-core accessibility violations with menu closed and open', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // 1. Menu closed
    const resultsClosed = await new AxeBuilder({ page })
      .include('header')
      .analyze();
    expect(resultsClosed.violations).toEqual([]);

    // 2. Menu open
    const langBtn = page.getByTestId('lang-switcher');
    await langBtn.click();
    await expect(page.getByRole('menu')).toBeVisible();

    const resultsOpen = await new AxeBuilder({ page })
      .include('header')
      .analyze();
    expect(resultsOpen.violations).toEqual([]);
  });

  test('mobile navigation panel toggles below 820px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'networkidle' });

    const header = page.locator('header').first();
    const toggleBtn = header.getByRole('button', { name: /navigation menu/i });
    await expect(toggleBtn).toBeVisible();
    await expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');

    // Open mobile menu
    await toggleBtn.click();
    await expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');

    const mobilePanel = header.locator('#mobile-nav-panel');
    await expect(mobilePanel).toBeVisible();
    await expect(mobilePanel.getByRole('link', { name: 'Overview' })).toHaveAttribute(
      'aria-current',
      'page'
    );

    // Close mobile menu
    await toggleBtn.click();
    await expect(mobilePanel).not.toBeVisible();
  });
});
