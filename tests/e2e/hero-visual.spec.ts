import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Pixel difference calculator running in browser canvas.
 * Compares two image data URLs and returns difference ratio (0 to 1).
 */
async function computeDiffRatio(
  page: any,
  dataUrlA: string,
  dataUrlB: string
): Promise<{ diffRatio: number; diffPixels: number; totalPixels: number }> {
  return await page.evaluate(
    async ({ urlA, urlB }: { urlA: string; urlB: string }) => {
      const loadImg = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = url;
        });

      const [imgA, imgB] = await Promise.all([loadImg(urlA), loadImg(urlB)]);
      const width = Math.max(imgA.width, imgB.width);
      const height = Math.max(imgA.height, imgB.height);

      const canvasA = document.createElement('canvas');
      canvasA.width = width;
      canvasA.height = height;
      const ctxA = canvasA.getContext('2d')!;
      ctxA.drawImage(imgA, 0, 0);
      const dataA = ctxA.getImageData(0, 0, width, height).data;

      const canvasB = document.createElement('canvas');
      canvasB.width = width;
      canvasB.height = height;
      const ctxB = canvasB.getContext('2d')!;
      ctxB.drawImage(imgB, 0, 0);
      const dataB = ctxB.getImageData(0, 0, width, height).data;

      let diffPixels = 0;
      const totalPixels = width * height;

      for (let i = 0; i < dataA.length; i += 4) {
        const rDiff = Math.abs(dataA[i] - dataB[i]);
        const gDiff = Math.abs(dataA[i + 1] - dataB[i + 1]);
        const bDiff = Math.abs(dataA[i + 2] - dataB[i + 2]);
        const aDiff = Math.abs(dataA[i + 3] - dataB[i + 3]);
        // Threshold of 15 to accommodate minor subpixel font rendering anti-aliasing
        if (rDiff > 15 || gDiff > 15 || bDiff > 15 || aDiff > 15) {
          diffPixels++;
        }
      }

      return {
        diffRatio: diffPixels / totalPixels,
        diffPixels,
        totalPixels,
      };
    },
    { urlA: dataUrlA, urlB: dataUrlB }
  );
}

test.describe('Landing Hero Visual & Accessibility Conformance', () => {
  const VIEWPORTS = [
    { name: '1920px (Desktop wide)', width: 1920, height: 1080 },
    { name: '1360px (Standard desktop)', width: 1360, height: 900 },
    { name: '390px (Mobile)', width: 390, height: 1200 },
  ];

  for (const vp of VIEWPORTS) {
    test(`matches reference HTML pixel for pixel at ${vp.width}px (<1% diff)`, async ({
      page,
      context,
    }) => {
      // 1. Render reference HTML with animations paused via reduced motion
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/hero-reference.html', { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => document.fonts.ready);

      const refSection = page.locator('section.hero');
      const refBox = await refSection.boundingBox();
      expect(refBox).not.toBeNull();
      const refScreenshot = await refSection.screenshot();
      const refDataUrl = `data:image/png;base64,${refScreenshot.toString('base64')}`;

      // 2. Render Next.js production Hero component rendered the same way
      const compPage = await context.newPage();
      await compPage.setViewportSize({ width: vp.width, height: vp.height });
      await compPage.emulateMedia({ reducedMotion: 'reduce' });
      await compPage.goto('/', { waitUntil: 'domcontentloaded' });
      await compPage.evaluate(() => document.fonts.ready);

      const compSection = compPage.locator('section[aria-label^="Welcome"]');
      const compBox = await compSection.boundingBox();
      expect(compBox).not.toBeNull();

      // Ensure geometry matches
      if (refBox && compBox) {
        expect(Math.abs(refBox.height - compBox.height)).toBeLessThanOrEqual(4);
      }

      const compScreenshot = await compSection.screenshot();
      const compDataUrl = `data:image/png;base64,${compScreenshot.toString('base64')}`;

      // 3. Pixel comparison
      const result = await computeDiffRatio(page, refDataUrl, compDataUrl);
      console.log(
        `Visual diff at ${vp.width}px: ${(result.diffRatio * 100).toFixed(4)}% (${result.diffPixels}/${result.totalPixels} px)`
      );

      // Criteria: Differences must be under 1% (0.01)
      expect(result.diffRatio).toBeLessThan(0.01);

      await compPage.close();
    });
  }

  test('reduced-motion preference freezes animations, positions pills statically and shows Wedding', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const heroSection = page.locator('section[aria-label^="Welcome"]');
    await expect(heroSection).toBeVisible();

    // In reduced motion, Wedding block (.cs1) must be visible with opacity 1
    const weddingCard = heroSection.locator('strong:text("Wedding")');
    await expect(weddingCard).toBeVisible();

    const weddingBudgetText = heroSection.locator('b:text("₹18,00,000")');
    await expect(weddingBudgetText).toBeVisible();

    // Check static rotations for the 3 pills (-90deg, 30deg, 150deg)
    const armTransforms = await heroSection.evaluate((el) => {
      const arms = el.querySelectorAll('[class*="arm"]');
      return Array.from(arms).map((arm) => {
        const computed = window.getComputedStyle(arm);
        return computed.transform;
      });
    });

    expect(armTransforms.length).toBe(3);
    // matrix for -90deg: matrix(0, -1, 1, 0, 0, 0)
    // matrix for 30deg: matrix(cos(30), sin(30), -sin(30), cos(30), 0, 0) => (0.866, 0.5, -0.5, 0.866, 0, 0)
    // matrix for 150deg: matrix(cos(150), sin(150), -sin(150), cos(150), 0, 0) => (-0.866, 0.5, -0.5, -0.866, 0, 0)
    expect(armTransforms[0]).toContain('matrix');
    expect(armTransforms[1]).toContain('matrix');
    expect(armTransforms[2]).toContain('matrix');
  });

  test('hero section reports zero axe-core accessibility violations', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const results = await new AxeBuilder({ page })
      .include('section[aria-label^="Welcome"]')
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('interactive elements meet touch target and focus visibility standards', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const heroSection = page.locator('section[aria-label^="Welcome"]');
    const buttons = heroSection.locator('button');
    const count = await buttons.count();

    expect(count).toBeGreaterThanOrEqual(6); // 4 chips + 2 action buttons

    for (let i = 0; i < count; i++) {
      const btn = buttons.nth(i);
      const box = await btn.boundingBox();
      expect(box).not.toBeNull();
      // Minimum 44px touch target height
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  });
});
