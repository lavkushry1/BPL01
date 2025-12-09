import { test, expect } from '@playwright/test';

/**
 * End-to-end test for the complete event booking and checkout flow
 */
test.describe('Checkout Flow', () => {
  test('User can book tickets and complete checkout process', async ({ page }) => {
    // Step 1: Navigate to home page
    await page.goto('/');
    await expect(page).toHaveTitle(/Eventia/);
    
    // Step 2: Find and click on an event
    await page.getByRole('heading', { name: /Summer Music Festival/ }).click();
    
    // Step 3: Verify event details page loaded
    await expect(page.getByRole('heading', { name: /Summer Music Festival/ })).toBeVisible();
    await expect(page.getByText(/Annual music festival/)).toBeVisible();
    
    // Step 4: Select tickets
    await page.getByRole('button', { name: /Get Tickets/ }).click();
    
    // Step 5: Select ticket category and quantity
    await page.getByText('General Admission').click();
    await page.getByRole('button', { name: /\+/ }).click(); // Increase quantity
    await page.getByRole('button', { name: /Continue/ }).click();
    
    // Step 6: Verify ticket selection summary
    await expect(page.getByText(/Ticket Summary/)).toBeVisible();
    await expect(page.getByText(/General Admission/)).toBeVisible();
    await expect(page.getByText(/2 x/)).toBeVisible();
    
    // Step 7: Continue to seat selection (if applicable)
    // Note: This step may not exist for all events
    const hasSeatMap = await page.getByText(/Select Your Seats/).isVisible();
    if (hasSeatMap) {
      // Select seats on the seating map
      await page.getByTestId('seat-A1').click();
      await page.getByTestId('seat-A2').click();
      await page.getByRole('button', { name: /Continue/ }).click();
    }
    
    // Step 8: Continue to checkout
    await page.getByRole('button', { name: /Proceed to Checkout/ }).click();
    
    // Step 9: Check if user needs to log in
    const loginRequired = await page.getByText(/Login to continue/).isVisible();
    if (loginRequired) {
      // Fill login form
      await page.getByLabel('Email').fill('test@example.com');
      await page.getByLabel('Password').fill('password123');
      await page.getByRole('button', { name: /Login/ }).click();
      
      // Verify successful login and redirection back to checkout
      await expect(page.getByText(/Checkout/)).toBeVisible();
    }
    
    // Step 10: Fill checkout form
    await page.getByLabel(/Full Name/).fill('Test User');
    await page.getByLabel(/Email/).fill('test@example.com');
    await page.getByLabel(/Phone/).fill('1234567890');
    
    // Step 11: Select payment method
    await page.getByLabel(/UPI/).check();
    
    // Step 12: Accept terms and conditions
    await page.getByLabel(/I agree to the terms/).check();
    
    // Step 13: Click on Pay button
    await page.getByRole('button', { name: /Pay Now/ }).click();
    
    // Step 14: Handle UPI payment screen
    await expect(page.getByText(/UPI Payment/)).toBeVisible();
    
    // Step 15: Enter UPI ID and complete payment
    await page.getByLabel(/UPI ID/).fill('test@upi');
    await page.getByLabel(/UTR Number/).fill('UTR123456789');
    await page.getByRole('button', { name: /Verify Payment/ }).click();
    
    // Step 16: Verify success message and booking confirmation
    await expect(page.getByText(/Payment Successful/)).toBeVisible();
    await expect(page.getByText(/Booking Confirmed/)).toBeVisible();
    
    // Step 17: Check for booking details
    await expect(page.getByText(/Booking Reference/)).toBeVisible();
    await expect(page.getByText(/Summer Music Festival/)).toBeVisible();
    
    // Step 18: Verify ticket download option is available
    await expect(page.getByRole('button', { name: /Download Tickets/ })).toBeVisible();
  });
  
  test('User can view booking details after purchase', async ({ page }) => {
    // Step 1: Login
    await page.goto('/login');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: /Login/ }).click();
    
    // Step 2: Navigate to My Bookings page
    await page.getByRole('link', { name: /My Bookings/ }).click();
    
    // Step 3: Verify bookings are displayed
    await expect(page.getByText(/Summer Music Festival/)).toBeVisible();
    
    // Step 4: View booking details
    await page.getByRole('button', { name: /View Details/ }).first().click();
    
    // Step 5: Verify booking details
    await expect(page.getByText(/Booking Details/)).toBeVisible();
    await expect(page.getByText(/General Admission/)).toBeVisible();
    
    // Step 6: Verify access to tickets
    await expect(page.getByRole('button', { name: /Download Tickets/ })).toBeVisible();
  });
  
  test('User sees appropriate error for sold-out event', async ({ page }) => {
    // Step 1: Navigate to home page
    await page.goto('/');
    
    // Step 2: Setup - Create an intercept for a sold out event
    await page.route('**/api/v1/events/**', async (route) => {
      const response = await route.fetch();
      const json = await response.json();
      
      // Modify the response to make all ticket categories sold out
      if (json.data && json.data.ticketCategories) {
        json.data.ticketCategories = json.data.ticketCategories.map((tc: any) => ({
          ...tc,
          availableSeats: 0,
          isSoldOut: true
        }));
      }
      
      await route.fulfill({ response, json });
    });
    
    // Step 3: Navigate to event with now-sold-out tickets
    await page.getByRole('heading', { name: /Summer Music Festival/ }).click();
    
    // Step 4: Try to get tickets
    await page.getByRole('button', { name: /Get Tickets/ }).click();
    
    // Step 5: Verify sold out message is shown
    await expect(page.getByText(/Sold Out/i)).toBeVisible();
    await expect(page.getByText(/No available tickets/i)).toBeVisible();
  });
}); 