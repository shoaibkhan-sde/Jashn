import { test, expect } from '@playwright/test';

test.describe('Jashn Celebration & Event Planner', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  test('renders festive hero and Priya & Arjun wedding plan from Main.dc', async ({ page }) => {
    // Check main branding and heading
    await expect(page.locator('h1')).toContainText('Priya & Arjun’s Wedding');
    await expect(page.getByText('One planner for every celebration')).toBeVisible();

    // Check budget figures
    await expect(page.getByText('₹3,95,000')).toBeVisible();
    await expect(page.getByText('of ₹18,00,000')).toBeVisible();
    await expect(page.getByText('22% spent')).toBeVisible();

    // Check guest count and location
    await expect(page.getByRole('main').getByText('220 guests')).toBeVisible();
    await expect(page.getByText('Nanded, Maharashtra')).toBeVisible();
  });

  test('switches tabs and displays respective planning sections', async ({ page }) => {
    // Switch to Ideas tab
    await page.getByRole('tab', { name: 'Ideas' }).click();
    await expect(page.getByText('Personalized Celebration Ideas')).toBeVisible();

    // Switch to Scenarios tab
    await page.getByRole('tab', { name: 'Scenarios' }).click();
    await expect(page.getByText('What-If Budget & Headcount Scenarios')).toBeVisible();

    // Switch back to Overview tab
    await page.getByRole('tab', { name: 'Overview' }).click();
    await expect(page.getByRole('heading', { name: 'Budget' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Next up' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Vendor checklist' })).toBeVisible();
  });

  test('interacts with planner assistant to simulate and apply a 10% budget cut', async ({ page }) => {
    // Type query in assistant input
    const input = page.locator('#ask');
    await input.fill('Cut 10% from the total but keep the photographer.');
    await page.getByRole('button', { name: 'Send', exact: true }).click();

    // Wait for response bubble
    const assistantBubble = page.locator('text=Totals were recalculated by the planner');
    await expect(assistantBubble.first()).toBeVisible();

    // Click Compare button to view diff modal
    await page.getByRole('button', { name: 'Compare' }).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Total Budget', { exact: true })).toBeVisible();

    // Apply changes to plan
    await page.getByRole('button', { name: 'Apply to Plan' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Verify budget updated to 16,20,000
    await expect(page.getByText('of ₹16,20,000')).toBeVisible();
  });

  test('switches celebration templates to Birthday', async ({ page }) => {
    // Click Birthday in hero quick-switcher
    await page.getByRole('button', { name: 'Birthday', exact: true }).first().click();

    // Header updates to Aarav's birthday
    await expect(page.locator('h1')).toContainText('Aarav’s 10th Birthday Bash');
    await expect(page.getByText('Pune, Maharashtra')).toBeVisible();
  });



  test('toggles dark and light mode seamlessly', async ({ page }) => {
    const themeBtn = page.getByRole('button', { name: /Switch to dark mode/i });
    await themeBtn.click();
    await expect(page.locator('html')).toHaveClass(/dark/);

    const lightBtn = page.getByRole('button', { name: /Switch to light mode/i });
    await lightBtn.click();
    await expect(page.locator('html')).not.toHaveClass(/dark/);
  });
});
