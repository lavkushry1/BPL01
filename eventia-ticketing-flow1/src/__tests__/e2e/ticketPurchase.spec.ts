import { test, expect } from '@playwright/test';

test.describe('Ticket Purchase Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the homepage
    await page.goto('/');
  });
  
  test('should navigate to event details from homepage', async ({ page }) => {
    // Find and click on an event card
    await page.locator('.event-card').first().click();
    
    // Verify we're on the event details page
    await expect(page).toHaveURL(/.*\/events\/\d+/);
    await expect(page.locator('h1.event-title')).toBeVisible();
  });
  
  test('should add tickets to cart and proceed to checkout', async ({ page }) => {
    // Navigate to an event
    await page.locator('.event-card').first().click();
    
    // Select tickets
    await page.locator('button.ticket-quantity-increase').click();
    
    // Click the "Add to Cart" button
    await page.locator('button.add-to-cart').click();
    
    // Verify the success toast appears
    await expect(page.locator('.toast-success')).toBeVisible();
    
    // Go to cart
    await page.locator('a.cart-link').click();
    
    // Verify we're on the cart page
    await expect(page).toHaveURL(/.*\/cart/);
    
    // Check if tickets are in cart
    await expect(page.locator('.cart-item')).toBeVisible();
    
    // Proceed to checkout
    await page.locator('button.checkout-button').click();
    
    // Verify we're on the checkout page
    await expect(page).toHaveURL(/.*\/checkout/);
  });
  
  test('should complete checkout process for logged in user', async ({ page }) => {
    // Log in first
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.locator('button[type="submit"]').click();
    
    // Verify login successful
    await expect(page.locator('.user-avatar')).toBeVisible();
    
    // Navigate to an event
    await page.goto('/');
    await page.locator('.event-card').first().click();
    
    // Select tickets
    await page.locator('button.ticket-quantity-increase').click();
    
    // Add to cart
    await page.locator('button.add-to-cart').click();
    
    // Go to cart
    await page.locator('a.cart-link').click();
    
    // Proceed to checkout
    await page.locator('button.checkout-button').click();
    
    // Since user is logged in, billing details should be prefilled
    // Just check and verify payment section
    await expect(page.locator('.payment-section')).toBeVisible();
    
    // Select payment method
    await page.locator('input[name="payment-method"][value="card"]').check();
    
    // Fill credit card details (using test card)
    await page.locator('input[name="card-number"]').fill('4242424242424242');
    await page.locator('input[name="card-expiry"]').fill('12/25');
    await page.locator('input[name="card-cvc"]').fill('123');
    
    // Complete purchase
    await page.locator('button.complete-purchase').click();
    
    // Verify success page
    await expect(page).toHaveURL(/.*\/confirmation/);
    await expect(page.locator('.confirmation-header')).toContainText('Thank you for your purchase');
    
    // Verify ticket information is displayed
    await expect(page.locator('.ticket-info')).toBeVisible();
  });
  
  test('should handle mobile responsive views during purchase', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 390, height: 844 });
    
    // Go to homepage
    await page.goto('/');
    
    // Verify mobile menu is visible
    await expect(page.locator('.mobile-menu-button')).toBeVisible();
    
    // Open mobile menu
    await page.locator('.mobile-menu-button').click();
    
    // Navigate to events
    await page.locator('a.mobile-nav-link').filter({ hasText: 'Events' }).click();
    
    // Select an event
    await page.locator('.event-card').first().click();
    
    // Check if the mobile UI elements are displayed properly
    await expect(page.locator('.mobile-action-bar')).toBeVisible();
    
    // Add tickets in mobile view
    await page.locator('button.mobile-add-ticket').click();
    
    // Add to cart
    await page.locator('button.mobile-add-to-cart').click();
    
    // Verify the toast notification appears
    await expect(page.locator('.toast')).toBeVisible();
    
    // Navigate to cart using mobile navigation
    await page.locator('.mobile-cart-icon').click();
    
    // Verify cart page is optimized for mobile
    await expect(page.locator('.mobile-cart-summary')).toBeVisible();
    
    // Check if the mobile checkout button is displayed
    await expect(page.locator('button.mobile-checkout-button')).toBeVisible();
  });
}); 