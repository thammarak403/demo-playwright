import { test, expect, type Page } from '@playwright/test';

const users = {
  standard: { username: 'standard_user', password: 'secret_sauce' },
  lockedOut: { username: 'locked_out_user', password: 'secret_sauce' },
};

async function login(
  page: Page,
  username = users.standard.username,
  password = users.standard.password,
) {
  await page.goto('https://www.saucedemo.com/');
  await page.locator('#user-name').fill(username);
  await page.locator('#password').fill(password);
  await page.locator('#login-button').click();
}

test('should login successfully with standard user', async ({ page }) => {
  await login(page);
  await expect(page).toHaveURL(/inventory\.html/);
  await expect(page.locator('.inventory_list')).toBeVisible();
});

test('should show error for locked out user', async ({ page }) => {
  await login(page, users.lockedOut.username, users.lockedOut.password);
  await expect(page.locator('.error-message-container')).toContainText(
    'Epic sadface: Sorry, this user has been locked out.',
  );
});

test.describe('inventory', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await expect(page.locator('.inventory_list')).toBeVisible();
  });

  test('should add item to cart', async ({ page }) => {
    await page.locator('[data-test="add-to-cart-sauce-labs-backpack"]').click();
    await expect(page.locator('.shopping_cart_badge')).toHaveText('1');
  });

  test('should sort items by price low to high', async ({ page }) => {
    const sortDropdown = page.locator('[data-test="product-sort-container"]');
    await expect(sortDropdown).toBeVisible();
    await sortDropdown.selectOption('lohi');
    await expect(sortDropdown).toHaveValue('lohi');

    const priceTexts = await page.locator('.inventory_item_price').allTextContents();
    const prices = priceTexts.map((t) => Number(t.replace('$', '')));

    expect(prices.length).toBeGreaterThan(1);
    expect(prices.every(Number.isFinite)).toBe(true);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  test('should complete checkout process', async ({ page }) => {
    await page.locator('[data-test="add-to-cart-sauce-labs-backpack"]').click();
    await page.locator('.shopping_cart_link').click();
    await page.locator('[data-test="checkout"]').click();
    await page.locator('#first-name').fill('John');
    await page.locator('#last-name').fill('Doe');
    await page.locator('#postal-code').fill('12345');
    await page.locator('[data-test="continue"]').click();
    await page.locator('[data-test="finish"]').click();
    await expect(page.locator('.complete-header')).toHaveText(
      'Thank you for your order!',
    );
  });
});
