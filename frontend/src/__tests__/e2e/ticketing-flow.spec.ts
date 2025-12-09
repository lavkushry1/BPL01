import { test, expect } from '@playwright/test';

test.describe('Ticketing Flow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page
    await page.goto('/');
    
    // Login if needed (mock for tests)
    await mockAuthentication(page);
  });

  test('Complete ticket booking process', async ({ page }) => {
    // Step 1: Browse events
    await test.step('Browse events', async () => {
      await page.getByRole('heading', { name: 'Upcoming Events' }).waitFor();
      
      // Click on an event
      await page.getByText('IPL 2025: Mumbai Indians vs Chennai Super Kings').click();
      
      // Verify event details page loaded
      await expect(page.getByRole('heading', { name: /Mumbai Indians vs Chennai Super Kings/i }))
        .toBeVisible();
      
      // Verify Buy Tickets button is visible
      await expect(page.getByRole('button', { name: 'Buy Tickets' })).toBeVisible();
    });

    // Step 2: Select seats
    await test.step('Select seats', async () => {
      // Click Buy Tickets
      await page.getByRole('button', { name: 'Buy Tickets' }).click();
      
      // Wait for seat selection page
      await page.getByText('Select Your Seats').waitFor();
      
      // Select a section
      await page.getByText('Premium Stand').click();
      
      // Select a specific seat
      await page.locator('.seat-map').getByText('A-12').click();
      
      // Proceed to checkout
      await page.getByRole('button', { name: 'Continue to Checkout' }).click();
      
      // Verify checkout page loaded
      await expect(page.getByText('Order Summary')).toBeVisible();
    });

    // Step 3: Auto-apply discount
    await test.step('Apply discount', async () => {
      // Check if discount is auto-applied
      const discountApplied = await page.getByText('Discount Applied').isVisible();
      
      if (!discountApplied) {
        // Manually enter discount code
        await page.getByPlaceholder('Enter discount code').fill('EARLYBIRD');
        await page.getByRole('button', { name: 'Apply' }).click();
        
        // Verify discount applied
        await expect(page.getByText('Discount Applied')).toBeVisible();
      }
      
      // Verify total is updated
      await expect(page.getByText('₹')).toBeVisible();
    });

    // Step 4: Complete UPI payment
    await test.step('Complete payment', async () => {
      // Proceed to payment
      await page.getByRole('button', { name: 'Proceed to Payment' }).click();
      
      // Wait for payment page
      await page.getByText('Complete your payment').waitFor();
      
      // Mock UPI payment (in real tests this would use test sandbox)
      await page.getByRole('button', { name: 'Pay with UPI' }).click();
      
      // Mock UTR entry (simulating payment completion)
      await page.getByPlaceholder('Enter UTR Number').fill('UTR123456789012');
      await page.getByRole('button', { name: 'Verify Payment' }).click();
      
      // Wait for payment processing
      await page.getByText('Verifying your payment').waitFor();
      
      // Mock successful payment response
      await mockPaymentSuccess(page);
      
      // Verify success page
      await expect(page.getByText('Payment Successful')).toBeVisible();
    });

    // Step 5: Download ticket with QR
    await test.step('Download ticket', async () => {
      // Navigate to ticket page
      await page.getByRole('button', { name: 'View My Ticket' }).click();
      
      // Verify ticket page loaded with QR code
      await expect(page.locator('.ticket-qr-code')).toBeVisible();
      
      // Verify ticket details
      await expect(page.getByText('Mumbai Indians vs Chennai Super Kings')).toBeVisible();
      
      // Mock download ticket
      const downloadPromise = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Download Ticket' }).click();
      const download = await downloadPromise;
      
      // Verify download started
      expect(download.suggestedFilename()).toContain('ticket');
    });
  });
});

// Helper function to mock authentication
async function mockAuthentication(page) {
  // Set localStorage to mock authenticated state
  await page.evaluate(() => {
    localStorage.setItem('auth_token', 'mock-token-for-testing');
    localStorage.setItem('user', JSON.stringify({
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com'
    }));
  });
}

// Helper function to mock successful payment
async function mockPaymentSuccess(page) {
  // Intercept network requests and mock payment verification response
  await page.route('**/payments/*/verify', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        status: 'COMPLETED',
        message: 'Payment completed successfully'
      })
    });
  });
} 