import { test, expect } from '@playwright/test';

test.describe('RA Guppy Coupon Generation & Management System', () => {
  const timestamp = Date.now();
  const testCouponCode = `TESTGUPPY${timestamp.toString().slice(-4)}`;

  test('Admin can manage coupons, generate single and bulk codes, and apply in cart', async ({ page }) => {
    // 1. Log in as Store Administrator
    await page.goto('/admin/login');
    await expect(page.locator('h1')).toContainText('Administrative Sign In');

    await page.locator('#admin-email').fill('raguppies00@gmail.com');
    await page.locator('#admin-password').fill('Rishan@123');
    await page.getByRole('button', { name: 'Sign In to Executive Console' }).click();

    // Verify successful login to Admin Dashboard
    await expect(page.locator('h1')).toContainText('Operations & Orders Dashboard', { timeout: 15000 });
    await expect(page.locator('body')).toContainText('Store Administrator');

    // 2. Navigate to Coupons & Discounts Management
    await page.goto('/admin/coupons');
    await expect(page).toHaveURL(/\/admin\/coupons/, { timeout: 10000 });
    await expect(page.locator('h1')).toContainText('Coupons & Discounts Management');

    // Verify KPI metric cards are visible
    await expect(page.getByText('Total Coupons', { exact: true })).toBeVisible();
    await expect(page.getByText('Active & Valid', { exact: true })).toBeVisible();
    await expect(page.getByText('Redemptions', { exact: true })).toBeVisible();

    // 3. Create a Single Promotional Coupon
    await page.getByRole('button', { name: 'Create New Coupon' }).click();
    await expect(page.locator('h3')).toContainText('Create Promotional Coupon');

    // Fill coupon form
    const codeInput = page.locator('#admin-coupon-code');
    await codeInput.fill(testCouponCode);

    const descInput = page.locator('#admin-coupon-desc');
    await descInput.fill('Playwright test 50% discount voucher');

    // Set discount value to 50%
    const valueInput = page.locator('#admin-coupon-value');
    await valueInput.fill('50');

    // Submit coupon
    await page.getByRole('button', { name: 'Create & Activate Coupon' }).click();

    // Wait for success toast / modal close
    await expect(page.locator('body')).toContainText(testCouponCode, { timeout: 10000 });

    // 4. Test Search filter for the created coupon
    const searchInput = page.locator('#admin-coupon-search');
    await searchInput.fill(testCouponCode);
    await expect(page.locator('table')).toContainText(testCouponCode);
    await expect(page.locator('table')).toContainText('50% OFF');

    // Clear search
    await searchInput.fill('');

    // 5. Test Bulk Coupon Generator
    await page.getByRole('button', { name: 'Generate Bulk Codes' }).click();
    await expect(page.locator('h3')).toContainText('Bulk Coupon Generator');

    const prefixInput = page.locator('#bulk-coupon-prefix');
    await prefixInput.fill('PLW');

    // Verify preview list contains generated codes
    await expect(page.locator('text=PLW-').first()).toBeVisible();

    // Save bulk codes
    await page.getByRole('button', { name: /Generate & Save All/ }).click();

    // Verify bulk modal closes and codes are saved
    await expect(page.getByRole('heading', { name: 'Bulk Coupon Generator' })).not.toBeVisible({ timeout: 15000 });

    // 6. Test Storefront: Add fish to cart & apply the newly generated coupon
    await page.goto('/shop');
    
    // Add first available product directly to cart
    const addToCartBtn = page.getByRole('button', { name: /Add to/i }).first();
    await addToCartBtn.click();

    // Navigate to Cart
    await page.goto('/cart');
    await expect(page).toHaveURL(/\/cart/);
    await expect(page.locator('h1')).toContainText('Shopping Cart');

    // Enter the newly created coupon code
    const couponInput = page.locator('#cart-coupon-input');
    await couponInput.fill(testCouponCode);
    await page.getByRole('button', { name: 'Apply' }).click();

    // Verify coupon is successfully applied and discount appears
    await expect(page.locator('body')).toContainText(testCouponCode);
    await expect(page.locator('body')).toContainText('Coupon Savings');

    // Verify coupon can be removed
    const removeCouponBtn = page.getByRole('button', { name: 'Remove', exact: true });
    await removeCouponBtn.click();
    await expect(page.locator('body')).not.toContainText(`Coupon Savings (${testCouponCode})`);
  });
});
