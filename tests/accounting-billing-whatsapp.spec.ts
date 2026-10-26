import { test, expect, Page } from '@playwright/test';

// Helper to ensure authenticated admin session before navigating
async function loginAsAdmin(page: Page) {
  await page.goto('/admin/login');
  await page.locator('input[type="email"]').fill('raguppies00@gmail.com');
  await page.locator('input[type="password"]').fill('Rishan@123');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/admin$/, { timeout: 15000 });
  await expect(page.locator('body')).toContainText('Store Administrator');
}

test.describe('RA Guppy — Production Accounting, Invoices, WhatsApp & Mobile E2E Suite', () => {

  test('1. Brand Integrity Audit: Strict RA Guppy Identity & Zero Legacy Brand Leakage', async ({ page }) => {
    await page.goto('/');

    // Check title and metadata
    const title = await page.title();
    expect(title).toContain('RA Guppy');
    expect(title).not.toContain('Betta');
    expect(title).not.toContain('Sheferoy');

    // Check header logo and brand text
    const header = page.locator('header');
    await expect(header).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Betta Aquatics');
    await expect(page.locator('body')).not.toContainText('Sheferoy Guppy');
    await expect(page.locator('body')).not.toContainText('Betta Fish');

    // Check Footer brand information
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText('RA Guppy');
    await expect(footer).toContainText('raguppies00@gmail.com');
    await expect(footer).toContainText('89211 90590');
  });

  test('2. Public Blog & Care Guides: Real Guppy Articles & Categories', async ({ page }) => {
    await page.goto('/blog');
    await expect(page.locator('h1')).toContainText('Guppy & Plant Journal');

    // Verify Guppy categories exist
    await expect(page.locator('body')).toContainText('Guppy Care & Water Quality');
    await expect(page.locator('body')).toContainText('Breeding & Genetics');
    await expect(page.locator('body')).toContainText('Feeding & Live Foods');

    // Verify articles are real Guppy articles
    await expect(page.locator('body')).toContainText('Mastering Pure Strain Guppy Care');
    await expect(page.locator('body')).toContainText('The Guppy Trio Breeding System');
    await expect(page.locator('body')).toContainText('Culturing Live Moina & Artemia');

    // Check individual blog post navigation
    await page.locator('text=Mastering Pure Strain Guppy Care').first().click();
    await expect(page).toHaveURL(/mastering-pure-strain-guppy-care/);
    await expect(page.locator('body')).toContainText('Poecilia reticulata');
    await expect(page.locator('body')).toContainText('General Hardness (GH)');
  });

  test('3. Mobile Responsiveness: 375px Viewport Audit (iPhone SE / Standard Mobile)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Verify Mobile Header
    const mobileHeader = page.locator('.md\\:hidden.sticky.top-0');
    await expect(mobileHeader).toBeVisible();
    await expect(mobileHeader).toContainText('RA');

    // Verify Mobile Bottom Navigation
    const bottomNav = page.locator('nav[aria-label="Mobile Navigation"]');
    await expect(bottomNav).toBeVisible();
    await expect(bottomNav).toContainText('Home');
    await expect(bottomNav).toContainText('Shop');
    await expect(bottomNav).toContainText('Orders');
    await expect(bottomNav).toContainText('Account');

    // Verify no horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });

  test('4. Admin Portal: Secure Login with Store Credentials', async ({ page }) => {
    await loginAsAdmin(page);

    // Verify dashboard metrics and navigation
    await expect(page.locator('body')).toContainText('Dashboard');
    await expect(page.locator('body')).toContainText('raguppies00@gmail.com');
    await expect(page.locator('body')).toContainText('Invoices & Billing');
    await expect(page.locator('body')).toContainText('Accounting & P&L');
    await expect(page.locator('body')).toContainText('Stock & Movements');
  });

  test('5. Admin Invoices & Billing Module: Invoices, Receipts & WhatsApp Dispatch', async ({ page }) => {
    await loginAsAdmin(page);

    // Navigate to Invoices & Billing
    await page.goto('/admin/invoices');
    await expect(page.locator('h1')).toContainText('Invoices & Payment Receipts');

    // Check presence of financial metrics
    await expect(page.locator('body')).toContainText('Total Invoiced');
    await expect(page.locator('body')).toContainText('Payments Collected');
    await expect(page.locator('body')).toContainText('Outstanding Due');

    // Open Generate Invoice from Order Modal
    const generateBtn = page.getByRole('button', { name: /Generate Invoice/i }).first();
    await expect(generateBtn).toBeVisible();
    await generateBtn.click();

    // Verify modal opened
    await expect(page.locator('body')).toContainText('Generate Invoice from Order');

    // If there is an order to issue invoice for, click Issue Invoice
    const issueBtn = page.getByRole('button', { name: 'Issue Invoice' }).first();
    if (await issueBtn.isVisible()) {
      await issueBtn.click();
      await expect(page.locator('body')).toContainText('INV-RG-');
    }

    // Switch to Payment Receipts tab
    await page.getByRole('button', { name: 'Payment Receipts' }).click();
    await expect(page.locator('body')).toContainText('Official verified receipts');
  });

  test('6. Admin Accounting & Expenses Module: P&L Telemetry & Ledger Entry', async ({ page }) => {
    await loginAsAdmin(page);

    // Navigate to Accounting
    await page.goto('/admin/accounting');
    await expect(page.locator('h1')).toContainText('Accounting, Expenses & P&L Telemetry');

    // Check P&L telemetry cards
    await expect(page.locator('body')).toContainText('Gross Verified Revenue');
    await expect(page.locator('body')).toContainText('Total Recorded Expenses');
    await expect(page.locator('body')).toContainText('Net Operating Profit');

    // Record a New Farm Expense
    const recordBtn = page.getByRole('button', { name: /Record.*Expense/i }).first();
    await expect(recordBtn).toBeVisible();
    await recordBtn.click();

    // Fill expense details using input placeholders
    await page.getByPlaceholder(/Local Oxygen Gas Supplier/i).fill('Marine Biotech Feed Labs');
    await page.getByPlaceholder('e.g. 1500').fill('1500');
    await page.getByPlaceholder(/oxygen canisters/i).fill('High-protein Artemia cysts and Moina yeast medium for juvenile fry');

    // Save expense
    await page.getByRole('button', { name: 'Record Expense' }).click();

    // Verify new expense is displayed in the ledger
    await expect(page.locator('body')).toContainText('Marine Biotech Feed Labs');
    await expect(page.locator('body')).toContainText('Feed & Live Foods');
  });

  test('7. Admin Stock Telemetry & Inventory Movements: Real-time Adjuster & Audit Log', async ({ page }) => {
    await loginAsAdmin(page);

    // Navigate to Inventory
    await page.goto('/admin/inventory');
    await expect(page.locator('h1')).toContainText('Live Inventory & Specimen Reservation');

    // Check inventory table headers
    await expect(page.locator('body')).toContainText('Specimen Details');
    await expect(page.locator('body')).toContainText('Available Stock');

    // Open Stock Adjustment Modal for first item
    const adjustBtn = page.getByRole('button', { name: 'Adjust Stock' }).first();
    if (await adjustBtn.isVisible()) {
      await adjustBtn.click();
      await expect(page.locator('body')).toContainText('Adjust Inventory Stock');
      await page.getByRole('button', { name: 'Update Stock Quantity' }).click();
    }

    // Open Stock Movement History tab
    await page.getByRole('button', { name: /Stock Movement Audit/i }).click();
    await expect(page.locator('body')).toContainText('Movement Type');
    await expect(page.locator('body')).toContainText('Previous → New');
  });

});
