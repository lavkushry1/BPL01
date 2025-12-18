import { test, expect } from '@playwright/test';

test.describe('E2E Booking Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    // 1. Open App & Login
    // Assuming a login page exists or we mock auth. 
    // The prompt says "Login as 'User'".
    await page.goto('/login');
    
    await page.fill('input[type="email"]', 'user@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Expect redirection to home
    await expect(page).toHaveURL('/');
  });

  test('User completes a booking journey from Mumbai -> MI vs CSK -> North Stand -> Pay', async ({ page }) => {
    // 2. Select "Mumbai" (City Filter)
    // Assuming there is a city selector or filter
    await page.getByRole('button', { name: /city/i }).click();
    await page.getByRole('option', { name: 'Mumbai' }).click();

    // Click "MI vs CSK" Match Card
    // Using text locator for the match title
    await page.getByText('MI vs CSK').first().click();

    // Verify we are on the layout page (Macro View)
    await expect(page).toHaveURL(/\/matches\/.*\/layout/);
    
    // 3. Click "North Stand" (Macro View)
    // The stand might be an SVG element or a button. 
    // Assuming accessibility name or text "North Stand"
    // Since it's an SVG map, we might have aria-label or title.
    await page.locator('[aria-label="North Stand"]').click();
    
    // Verify we switched to Micro View (Seat Grid)
    // Maybe check for "Back to Stadium" button which appears in step 2
    await expect(page.getByText('Back to Stadium')).toBeVisible();

    // Select 2 Seats (Micro View)
    // Assuming seats are buttons or clickable elements.
    // We need to find AVAILABLE seats.
    // Locator for available seats. Let's assume a class or test-id.
    const availableSeats = page.locator('[data-testid="seat-available"]');
    
    // Wait for seats to load
    await expect(availableSeats.first()).toBeVisible();
    
    // Click first two available seats
    await availableSeats.nth(0).click();
    await availableSeats.nth(1).click();

    // 4. Verify Cart Sticky Footer
    const footer = page.locator('footer'); // or specific class
    await expect(footer).toBeVisible();
    await expect(footer).toContainText('2 Seats');
    
    // Verify Price (assuming we know the price, e.g., 2 * 800 = 1600)
    // Or just check that price is displayed
    await expect(footer).toContainText('₹'); 

    // 5. Click "Pay" -> Verify Success
    await page.getByRole('button', { name: /proceed|pay/i }).click();

    // Expect redirection to Checkout or Success
    // If it goes to checkout first, we might need to fill payment.
    // The prompt says "Click 'Pay' -> Verify redirection to Success Page". 
    // This implies a simplified flow or we mock the payment gateway step.
    // Let's assume hitting "Proceed" in cart goes to a summary/payment page, 
    // and then we confirm payment.
    
    // If there is an intermediate "Checkout" page:
    if (await page.getByRole('heading', { name: 'Checkout' }).isVisible()) {
        await page.getByRole('button', { name: /confirm|pay/i }).click();
    }

    // Verify Success Page
    await expect(page).toHaveURL(/\/booking\/.*\/success/);
    await expect(page.getByText('Booking Confirmed')).toBeVisible();
  });
});
