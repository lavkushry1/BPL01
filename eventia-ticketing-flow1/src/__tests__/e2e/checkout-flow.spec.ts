import { test, expect } from '@playwright/test';

test.describe('Checkout Flow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page
    await page.goto('/');
    
    // Login if needed (mock for tests)
    await mockAuthentication(page);
  });

  test('Complete checkout flow with UPI payment', async ({ page }) => {
    // Step 1: Browse and select event
    await test.step('Select an event', async () => {
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

    // Step 3: Handle promo code and checkout options
    await test.step('Apply promo code and select checkout options', async () => {
      // Check if order summary shows the correct price
      await expect(page.getByText('₹')).toBeVisible();
      
      // Apply a promo code
      await page.getByPlaceholder('Enter promo code').fill('EARLYBIRD');
      await page.getByRole('button', { name: 'Apply' }).click();
      
      // Verify discount applied
      await expect(page.getByText('Discount Applied')).toBeVisible();
      
      // Select e-ticket delivery option
      await page.getByLabel('E-Ticket').check();
      
      // Add special requirements
      await page.getByPlaceholder('Any special requirements').fill('Wheelchair access, please');
      
      // Accept terms and conditions
      await page.getByLabel('I accept the terms and conditions').check();
      
      // Proceed to payment
      await page.getByRole('button', { name: 'Proceed to Payment' }).click();
      
      // Wait for payment page
      await page.getByText('Complete your payment').waitFor();
    });

    // Step 4: Complete payment process
    await test.step('Complete payment', async () => {
      // Select UPI payment method
      await page.getByRole('button', { name: 'Pay with UPI' }).click();
      
      // Enter UPI ID
      await page.getByPlaceholder('Enter UPI ID').fill('test@upi');
      
      // Submit payment
      await page.getByRole('button', { name: 'Pay Now' }).click();
      
      // Wait for payment processing and intercept the confirmation
      await mockPaymentSuccess(page);
      
      // Verify success page
      await expect(page.getByText('Payment Successful')).toBeVisible();
    });

    // Step 5: Verify ticket details and download
    await test.step('View and download ticket', async () => {
      // Click view ticket
      await page.getByRole('button', { name: 'View My Ticket' }).click();
      
      // Verify ticket details
      await expect(page.getByText('Mumbai Indians vs Chennai Super Kings')).toBeVisible();
      await expect(page.locator('.ticket-qr-code')).toBeVisible();
      
      // Verify seat details are correct
      await expect(page.getByText('Seat: A-12')).toBeVisible();
      await expect(page.getByText('Premium Stand')).toBeVisible();
      
      // Download ticket
      const downloadPromise = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Download Ticket' }).click();
      const download = await downloadPromise;
      
      // Verify download
      expect(download.suggestedFilename()).toContain('ticket');
    });
    
    // Step 6: Test sharing and additional options
    await test.step('Share ticket and access additional options', async () => {
      // Click share button
      await page.getByRole('button', { name: 'Share' }).click();
      
      // Verify share modal
      await expect(page.getByText('Share Your Ticket')).toBeVisible();
      
      // Test email sharing option
      await page.getByText('Email').click();
      await page.getByPlaceholder('Enter email address').fill('friend@example.com');
      await page.getByRole('button', { name: 'Send' }).click();
      
      // Verify confirmation
      await expect(page.getByText('Ticket shared successfully')).toBeVisible();
      
      // Close share modal
      await page.getByRole('button', { name: 'Close' }).click();
      
      // Access My Tickets section from account menu
      await page.getByRole('button', { name: 'Account' }).click();
      await page.getByText('My Tickets').click();
      
      // Verify tickets page
      await expect(page.getByText('Your Tickets')).toBeVisible();
      await expect(page.getByText('Mumbai Indians vs Chennai Super Kings')).toBeVisible();
    });
  });
  
  test('Handle payment failure gracefully', async ({ page }) => {
    // Navigate to an event and select seats (abbreviated steps)
    await page.goto('/events/123');
    await page.getByRole('button', { name: 'Buy Tickets' }).click();
    await page.locator('.seat-map').getByText('A-12').click();
    await page.getByRole('button', { name: 'Continue to Checkout' }).click();
    
    // Proceed to payment
    await page.getByRole('button', { name: 'Proceed to Payment' }).click();
    
    // Select UPI payment method
    await page.getByRole('button', { name: 'Pay with UPI' }).click();
    await page.getByPlaceholder('Enter UPI ID').fill('test@upi');
    
    // Mock payment failure
    await mockPaymentFailure(page);
    
    // Click pay
    await page.getByRole('button', { name: 'Pay Now' }).click();
    
    // Verify failure message
    await expect(page.getByText('Payment Failed')).toBeVisible();
    
    // Test retry functionality
    await page.getByRole('button', { name: 'Retry Payment' }).click();
    
    // Verify back on payment page
    await expect(page.getByText('Complete your payment')).toBeVisible();
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
  await page.route('**/api/payments/verify', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        status: 'COMPLETED',
        transactionId: 'mock-txn-123',
        message: 'Payment completed successfully'
      })
    });
  });
}

// Helper function to mock payment failure
async function mockPaymentFailure(page) {
  // Intercept network requests and mock payment failure response
  await page.route('**/api/payments/verify', async (route) => {
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({
        success: false,
        status: 'FAILED',
        message: 'Payment authorization failed'
      })
    });
  });
} 