import { test, expect } from '@playwright/test';

test.describe('RA Guppy Customer Authentication Lifecycle', () => {
  const timestamp = Date.now();
  const testUser = {
    name: `Test Customer ${timestamp}`,
    email: `test_customer_${timestamp}@raguppy.in`,
    password: 'SecurePassword123!',
    phone: '9845012345',
  };

  test('Complete Customer Auth Lifecycle: Register -> Persist on Reload -> Logout -> Login -> Duplicate check', async ({ browser }) => {
    // 1. Initial Browser Context (Session 1)
    const context = await browser.newContext();
    const page = await context.newPage();

    // Step A: Customer Registration
    await page.goto('/auth');
    await expect(page.locator('h1')).toContainText('RA');

    // Switch to Create Account mode
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Fill registration details
    await page.locator('#cust-name').fill(testUser.name);
    await page.locator('#cust-email').fill(testUser.email);
    await page.locator('#cust-phone').fill(testUser.phone);
    await page.locator('#cust-password').fill(testUser.password);

    // Submit registration
    await page.getByRole('button', { name: 'Register Customer Account' }).click();

    // Verify successful registration and navigation to /account
    await expect(page).toHaveURL(/\/account/, { timeout: 15000 });
    await expect(page.locator('body')).toContainText(testUser.name);

    // Step B: Verify Session Persistence Across Reload (No flash of "Sign In Required")
    await page.reload();
    await expect(page).toHaveURL(/\/account/);
    await expect(page.locator('h1')).not.toHaveText('Sign In Required');
    await expect(page.locator('body')).toContainText(testUser.name);

    // Step C: Verify Explicit Logout
    const logoutBtn = page.locator('button[aria-label="Sign Out"], button[title="Sign Out"]');
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();

    // Verify unauthenticated state on /account
    await expect(page.locator('h1')).toHaveText('Sign In Required', { timeout: 10000 });

    // Close session 1
    await context.close();

    // 2. New Browser Context (Session 2 - Simulates closing & restarting browser)
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();

    // Step D: Re-login with previously created credentials
    await page2.goto('/auth');
    await page2.locator('#cust-email').fill(testUser.email);
    await page2.locator('#cust-password').fill(testUser.password);
    await page2.getByRole('button', { name: 'Sign In to Account' }).click();

    // Verify successful login
    await expect(page2).toHaveURL(/\/account/, { timeout: 15000 });
    await expect(page2.locator('body')).toContainText(testUser.name);

    await context2.close();

    // 3. New Context (Session 3 - Normalization & Duplicate Prevention)
    const context3 = await browser.newContext();
    const page3 = await context3.newPage();

    // Step E: Email Normalization (trailing whitespace & uppercase letters)
    await page3.goto('/auth');
    await page3.locator('#cust-email').fill(`   ${testUser.email.toUpperCase()}   `);
    await page3.locator('#cust-password').fill(testUser.password);
    await page3.getByRole('button', { name: 'Sign In to Account' }).click();
    await expect(page3).toHaveURL(/\/account/, { timeout: 15000 });
    await expect(page3.locator('body')).toContainText(testUser.name);

    // Log out again
    await page3.locator('button[aria-label="Sign Out"]').click();
    await expect(page3.locator('h1')).toHaveText('Sign In Required');

    // Step F: Duplicate Registration Prevention
    await page3.goto('/auth');
    await page3.getByRole('button', { name: 'Create Account' }).click();
    await page3.locator('#cust-name').fill('Duplicate Test');
    await page3.locator('#cust-email').fill(testUser.email); // Same email
    await page3.locator('#cust-password').fill('NewPassword999!');
    await page3.getByRole('button', { name: 'Register Customer Account' }).click();

    // Verify duplicate account error message is displayed
    await expect(page3.locator('.text-red-700')).toContainText(/already exists/i, { timeout: 10000 });
    // URL must NOT navigate to /account
    expect(page3.url()).toContain('/auth');

    // Step G: Invalid Password Handling
    await page3.getByRole('button', { name: 'Customer Sign In' }).click();
    await page3.locator('#cust-email').fill(testUser.email);
    await page3.locator('#cust-password').fill('WrongPassword123');
    await page3.getByRole('button', { name: 'Sign In to Account' }).click();

    await expect(page3.locator('.text-red-700')).toContainText(/Invalid email address or password/i, { timeout: 10000 });
    expect(page3.url()).toContain('/auth');

    await context3.close();
  });

  test('Existing Customer Login & Checkout Auth State', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // 1. Login with existing known customer
    await page.goto('/auth');
    await page.locator('#cust-email').fill('customer@gmail.com');
    await page.locator('#cust-password').fill('Customer@123');
    await page.getByRole('button', { name: 'Sign In to Account' }).click();

    await expect(page).toHaveURL(/\/account/, { timeout: 15000 });
    await expect(page.locator('body')).toContainText(/Customer|customer@gmail.com/i);

    // 2. Navigate to Checkout Page while authenticated
    await page.goto('/checkout');
    await expect(page.locator('body')).toContainText(/Checkout|Delivery Address|Cart/i);

    // 3. Logout
    await page.goto('/account');
    await page.locator('button[aria-label="Sign Out"]').click();
    await expect(page.locator('h1')).toHaveText('Sign In Required');

    await context.close();
  });

  test('Admin Authentication & User Management System', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

    // 1. Admin Login with requested credentials: raguppies00@gmail.com / Rishan@123
    await page.goto('/admin/login');
    await expect(page.locator('body')).toContainText(/ADMIN/i);

    await page.locator('#admin-email').fill('raguppies00@gmail.com');
    await page.locator('#admin-password').fill('Rishan@123');
    await page.getByRole('button', { name: /Sign In to Executive Console/i }).click();

    // Verify redirected away from /admin/login to /admin dashboard
    await expect(page).toHaveURL(/\/admin(\/)?$/, { timeout: 15000 });
    await expect(page.locator('body')).toContainText(/Dashboard/i);

    // 2. Navigate to User Management
    await page.goto('/admin/users');
    await expect(page.locator('h1')).toContainText(/User & Staff Directory/i);
    await expect(page.locator('body')).toContainText(/Total Accounts|Customers|Full Administrators/i);
    await expect(page.locator('body')).toContainText('raguppies00@gmail.com');

    // 3. Filter by role or search
    const searchInput = page.locator('input[placeholder*="Search by customer name"]');
    await searchInput.fill('raguppies00');
    await expect(page.locator('body')).toContainText('raguppies00@gmail.com');

    await context.close();
  });
});
