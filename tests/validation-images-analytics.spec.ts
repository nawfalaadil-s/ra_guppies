import { test, expect, Page } from '@playwright/test';

// Helper to log in as administrator
async function loginAsAdmin(page: Page) {
  await page.goto('/admin/login');
  await page.locator('input[type="email"]').fill('raguppies00@gmail.com');
  await page.locator('input[type="password"]').fill('Rishan@123');
  await page.getByRole('button', { name: 'Sign In to Executive Console' }).click();
  await page.waitForURL(/\/admin/, { timeout: 15000 });
  await expect(page.locator('body')).toContainText('Store Administrator');
}

test.describe('RA Guppy — Functional Validation, Image Authenticity & Website Analytics Suite', () => {

  test('1. Website Analytics Dashboard: KPI Telemetry, Funnel & Date Filters', async ({ page }) => {
    await loginAsAdmin(page);

    // 1. Navigate to Website Analytics CMS section
    await page.goto('/admin/analytics');
    await expect(page).toHaveURL(/\/admin\/analytics/, { timeout: 10000 });
    await expect(page.locator('h1')).toContainText('Website Analytics');

    // 2. Verify KPI Metric Cards
    await expect(page.getByText('Page Views').first()).toBeVisible();
    await expect(page.getByText('Visitors').first()).toBeVisible();
    await expect(page.getByText('Sessions').first()).toBeVisible();
    await expect(page.getByText('Avg Session').first()).toBeVisible();
    await expect(page.getByText('Revenue').first()).toBeVisible();
    await expect(page.getByText('Conversion').first()).toBeVisible();

    // 3. Verify E-Commerce Funnel Progression stages
    await expect(page.getByText('E-Commerce Purchase Funnel Progression')).toBeVisible();
    await expect(page.getByText('1. Store Visits')).toBeVisible();
    await expect(page.getByText('2. Specimen Views')).toBeVisible();
    await expect(page.getByText('3. Add to Tank')).toBeVisible();
    await expect(page.getByText('4. Checkout Initiated')).toBeVisible();
    await expect(page.getByText('5. Verified Consignments')).toBeVisible();

    // 4. Test Date Range Presets
    const todayBtn = page.getByRole('button', { name: 'Today', exact: true });
    await todayBtn.click();
    await expect(todayBtn).toHaveClass(/bg-teal-700/);

    const last7dBtn = page.getByRole('button', { name: 'Last 7 Days', exact: true });
    await last7dBtn.click();
    await expect(last7dBtn).toHaveClass(/bg-teal-700/);

    const last30dBtn = page.getByRole('button', { name: 'Last 30 Days', exact: true });
    await last30dBtn.click();
    await expect(last30dBtn).toHaveClass(/bg-teal-700/);

    // 5. Test Tab Navigation
    const productTab = page.getByRole('button', { name: /Specimen Performance/i });
    await productTab.click();
    await expect(page.locator('table')).toContainText('Specimen Strain');

    const blogsTab = page.getByRole('button', { name: /Care Guides & Articles/i });
    await blogsTab.click();
    await expect(page.locator('table')).toContainText('Article Title');

    const searchesTab = page.getByRole('button', { name: /Search Inquiries/i });
    await searchesTab.click();
    await expect(page.locator('table')).toContainText('Search Term');

    // 6. Test CSV Export dropdown
    const exportBtn = page.getByRole('button', { name: 'Export CSV' });
    await exportBtn.click();
    await expect(page.getByText('Page Views Summary')).toBeVisible();
    await expect(page.getByText('Funnel Progression CSV')).toBeVisible();
    await expect(page.getByText('Daily Traffic Trends')).toBeVisible();
    await expect(page.getByText('Specimen Performance CSV')).toBeVisible();
  });

  test('2. First-Party Telemetry Recording & Funnel Event Logging', async ({ page }) => {
    // Navigate storefront
    await page.goto('/');
    await page.waitForTimeout(500);

    // View Product Catalog
    await page.goto('/shop');
    await page.waitForTimeout(500);

    // View Product Detail
    await page.goto('/product/electric-blue-guppy-pair-300');
    await expect(page.locator('h1')).toContainText('Electric Blue Guppy');

    // Add to Cart
    const addBtn = page.getByRole('button', { name: /Add to Tank/i });
    await addBtn.click();
    await page.waitForTimeout(500);

    // Verify localStorage has recorded the user journey
    const recordedEvents = await page.evaluate(() => {
      const raw = localStorage.getItem('rg_analytics_events');
      return raw ? JSON.parse(raw) : [];
    });

    expect(recordedEvents.length).toBeGreaterThan(0);
    const eventTypes = recordedEvents.map((e: any) => e.event_type);
    expect(eventTypes).toContain('page_view');
    expect(eventTypes).toContain('view_item');
    expect(eventTypes).toContain('add_to_cart');
  });

  test('3. Image Authenticity & Non-Broken Media Audit', async ({ page }) => {
    // 1. Check Homepage Images and Hero
    await page.goto('/');

    const images = await page.evaluate(() => {
      const imgElements = Array.from(document.querySelectorAll('img'));
      return imgElements.map(img => ({
        src: img.src,
        complete: img.complete,
        naturalWidth: img.naturalWidth,
        alt: img.alt,
      }));
    });

    // Ensure images on home page are loaded and have natural dimensions
    for (const img of images.slice(0, 10)) {
      expect(img.complete).toBe(true);
      expect(img.naturalWidth).toBeGreaterThan(0);
    }

    // 2. Check Product Detail Page Specimen Media
    await page.goto('/product/afr-flower-dorsal-guppy-pair-400');
    const productImg = page.locator('img[alt*="Albino Full Red"]').first();
    await expect(productImg).toBeVisible();

    const isLoaded = await productImg.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0);
    expect(isLoaded).toBe(true);

    // Verify genuine product image path is used
    const imgSrc = await productImg.getAttribute('src');
    expect(imgSrc).toContain('/product_image/');

    // 3. Check Blog Post Feature Images
    await page.goto('/blog');
    const blogImg = page.locator('article img, .bg-white img').first();
    await expect(blogImg).toBeVisible();
    const blogImgLoaded = await blogImg.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0);
    expect(blogImgLoaded).toBe(true);
  });

  test('4. Security & Access Control: Protected Admin Endpoints Reject Guests', async ({ page }) => {
    // Attempt to access admin routes directly while unauthenticated
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/login/);

    await page.goto('/admin/analytics');
    await expect(page).toHaveURL(/\/admin\/login/);

    await page.goto('/admin/orders');
    await expect(page).toHaveURL(/\/admin\/login/);

    await page.goto('/admin/invoices');
    await expect(page).toHaveURL(/\/admin\/login/);

    await page.goto('/admin/accounting');
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('5. Multi-Device Responsive Viewport Audit: Zero Horizontal Overflow', async ({ page }) => {
    const viewports = [
      { width: 320, height: 568 },
      { width: 360, height: 640 },
      { width: 390, height: 844 },
      { width: 430, height: 932 },
      { width: 768, height: 1024 },
      { width: 1024, height: 768 },
      { width: 1280, height: 800 },
      { width: 1440, height: 900 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      await page.goto('/');

      const { scrollWidth, clientWidth, badElements } = await page.evaluate(() => {
        const docWidth = document.documentElement.clientWidth;
        const all = Array.from(document.querySelectorAll('*'));
        const bad = all
          .filter(el => {
            const rect = el.getBoundingClientRect();
            return rect.right > docWidth + 2 || el.scrollWidth > docWidth + 2;
          })
          .map(el => `<${el.tagName.toLowerCase()} class="${el.className}"> [right:${el.getBoundingClientRect().right}, scrollWidth:${el.scrollWidth}]`)
          .slice(0, 5);
        return {
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          badElements: bad,
        };
      });

      if (scrollWidth > clientWidth + 2) {
        console.log(`[OVERFLOW at ${vp.width}px]:`, badElements);
      }

      // No horizontal overflow on any device
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
    }
  });

});
