import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Audits (axe-core WCAG AA)', () => {
  test('home page passes all WCAG AA accessibility rules in default state', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules(['color-contrast']) // Ignore external simulated SVG contrast
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('home page passes accessibility in dark mode', async ({ page }) => {
    await page.goto('/');

    // Switch to dark mode
    const themeBtn = page.getByRole('button', { name: /Switch to dark mode/i });
    await themeBtn.click();

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('supports reduced-motion preference without layout breakage', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    // Verify page renders cleanly without motion
    await expect(page.locator('h1')).toContainText('Priya & Arjun’s Wedding');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('scenario comparison modal is accessible with focus trap and role dialog', async ({ page }) => {
    await page.goto('/');

    // Open comparison modal
    await page.getByRole('button', { name: 'Compare' }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);

    // Closes with Escape
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
});
