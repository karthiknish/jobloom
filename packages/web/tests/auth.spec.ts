import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies();
  });

  test('should load sign in page correctly', async ({ page }) => {
    await page.goto('/sign-in');
    
    // Check page title
    await expect(page).toHaveTitle(/Sign In/);
    
    // Check sign in form elements
    await expect(page.getByText('Sign In')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('button:has-text("Sign in with Google")')).toBeVisible();
  });

  test('should load sign up page correctly', async ({ page }) => {
    await page.goto('/sign-up');
    
    // Check page title
    await expect(page).toHaveTitle(/Sign Up/);
    
    // Check sign up form elements
    await expect(page.getByText('Sign Up')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('button:has-text("Sign up with Google")')).toBeVisible();
  });

  test('should sign in with valid credentials', async ({ page }) => {
    await page.goto('/sign-in');
    
    // Fill sign in form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Check if user is signed in
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/sign-in');
    
    // Fill sign in form with invalid credentials
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Check error message
    await expect(page.getByText(/Invalid credentials|Sign in failed/)).toBeVisible();
    
    // Should stay on sign in page
    await expect(page).toHaveURL('/sign-in');
  });

  test('should sign up with valid credentials', async ({ page }) => {
    await page.goto('/sign-up');
    
    // Fill sign up form
    await page.fill('input[type="email"]', 'newuser@example.com');
    await page.fill('input[type="password"]', 'newpassword123');
    await page.click('button[type="submit"]');
    
    // Should redirect to welcome page or dashboard
    await expect(page).toHaveURL(/\/(dashboard|welcome)/);
    
    // Check if user is signed in
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should show error for weak password during sign up', async ({ page }) => {
    await page.goto('/sign-up');
    
    // Fill sign up form with weak password
    await page.fill('input[type="email"]', 'newuser@example.com');
    await page.fill('input[type="password"]', '123');
    await page.click('button[type="submit"]');
    
    // Check error message
    await expect(page.getByText(/Password must be at least|Password too weak/)).toBeVisible();
    
    // Should stay on sign up page
    await expect(page).toHaveURL('/sign-up');
  });

  test('should show error for invalid email format', async ({ page }) => {
    await page.goto('/sign-up');
    
    // Fill sign up form with invalid email
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'validpassword123');
    await page.click('button[type="submit"]');
    
    // Check error message
    await expect(page.getByText(/Invalid email|Please enter a valid email/)).toBeVisible();
    
    // Should stay on sign up page
    await expect(page).toHaveURL('/sign-up');
  });

  test('should sign in with Google', async ({ page }) => {
    await page.goto('/sign-in');
    
    // Click Google sign in button
    await page.click('button:has-text("Sign in with Google")');
    
    // Note: This test would need to handle OAuth flow or mock it
    // For now, just check that the click works
    await expect(page.locator('button:has-text("Sign in with Google")')).toBeVisible();
  });

  test('should sign up with Google', async ({ page }) => {
    await page.goto('/sign-up');
    
    // Click Google sign up button
    await page.click('button:has-text("Sign up with Google")');
    
    // Note: This test would need to handle OAuth flow or mock it
    // For now, just check that the click works
    await expect(page.locator('button:has-text("Sign up with Google")')).toBeVisible();
  });

  test('should handle password reset', async ({ page }) => {
    await page.goto('/sign-in');
    
    // Click forgot password link
    await page.click('a:has-text("Forgot password?")');
    
    // Should redirect to forgot password page
    await expect(page).toHaveURL('/auth/forgot');
    
    // Check forgot password form
    await expect(page.getByText('Reset Password')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Fill email and submit
    await page.fill('input[type="email"]', 'test@example.com');
    await page.click('button[type="submit"]');
    
    // Check success message
    await expect(page.getByText(/Password reset email sent|Check your email/)).toBeVisible();
  });

  test('should handle email verification', async ({ page }) => {
    await page.goto('/verify-email');
    
    // Check email verification page
    await expect(page.getByText('Verify Email')).toBeVisible();
    await expect(page.getByText(/Please check your email|Verification link sent/)).toBeVisible();
    
    // Check for resend button
    await expect(page.locator('button:has-text("Resend Email")')).toBeVisible();
  });

  test('should sign out correctly', async ({ page }) => {
    // Sign in first
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
    
    // Sign out
    await page.click('[data-testid="user-menu"]');
    await page.click('button:has-text("Sign Out")');
    
    // Should redirect to sign in page
    await expect(page).toHaveURL('/sign-in');
    
    // Check that user is no longer signed in
    await expect(page.locator('[data-testid="user-menu"]')).not.toBeVisible();
  });

  test('should protect authenticated routes', async ({ page }) => {
    // Try to access dashboard without signing in
    await page.goto('/dashboard');
    
    // Should redirect to sign in
    await expect(page).toHaveURL('/sign-in');
    
    // Try to access settings without signing in
    await page.goto('/settings');
    
    // Should redirect to sign in
    await expect(page).toHaveURL('/sign-in');
    
    // Try to access CV evaluator without signing in
    await page.goto('/cv-evaluator');
    
    // Should redirect to sign in
    await expect(page).toHaveURL('/sign-in');
  });

  test('should handle session persistence', async ({ page }) => {
    // Sign in
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
    
    // Reload page
    await page.reload();
    
    // Should still be signed in
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should handle session expiration', async ({ page }) => {
    // Sign in
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
    
    // Clear cookies to simulate session expiration
    await page.context().clearCookies();
    
    // Try to access protected route
    await page.goto('/settings');
    
    // Should redirect to sign in
    await expect(page).toHaveURL('/sign-in');
  });

  test('should handle form validation', async ({ page }) => {
    await page.goto('/sign-in');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Check validation messages
    await expect(page.getByText(/Email is required|Please enter email/)).toBeVisible();
    await expect(page.getByText(/Password is required|Please enter password/)).toBeVisible();
    
    // Fill only email
    await page.fill('input[type="email"]', 'test@example.com');
    await page.click('button[type="submit"]');
    
    // Check password validation
    await expect(page.getByText(/Password is required|Please enter password/)).toBeVisible();
  });

  test('should handle loading states', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/auth/**', route => {
      setTimeout(() => route.continue(), 2000);
    });
    
    await page.goto('/sign-in');
    
    // Fill form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    
    // Check loading state
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
  });

  test('should handle network errors', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/auth/**', route => route.abort());
    
    await page.goto('/sign-in');
    
    // Fill form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    
    // Check error message
    await expect(page.getByText(/Network error|Connection failed|Unable to connect/)).toBeVisible();
  });

  test('should handle mobile responsiveness', async ({ page }) => {
    await page.goto('/sign-in');
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    
    await expect(page.getByText('Sign In')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await expect(page.getByText('Sign In')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});
