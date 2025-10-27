import { test, expect } from '@playwright/test';

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in before each test
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('should load settings page correctly', async ({ page }) => {
    await page.goto('/settings');
    
    // Check page title
    await expect(page).toHaveTitle(/Settings/);
    
    // Check main settings elements
    await expect(page.getByText('Settings')).toBeVisible();
    await expect(page.locator('[data-testid="settings-tabs"]')).toBeVisible();
  });

  test('should navigate between settings tabs', async ({ page }) => {
    await page.goto('/settings');
    
    // Test tab navigation
    await page.click('button:has-text("Profile")');
    await expect(page.locator('[data-testid="profile-settings"]')).toBeVisible();
    
    await page.click('button:has-text("Security")');
    await expect(page.locator('[data-testid="security-settings"]')).toBeVisible();
    
    await page.click('button:has-text("Preferences")');
    await expect(page.locator('[data-testid="preferences-settings"]')).toBeVisible();
    
    await page.click('button:has-text("Autofill")');
    await expect(page.locator('[data-testid="autofill-settings"]')).toBeVisible();
    
    await page.click('button:has-text("Features")');
    await expect(page.locator('[data-testid="features-settings"]')).toBeVisible();
  });

  test('should update profile settings', async ({ page }) => {
    await page.goto('/settings');
    await page.click('button:has-text("Profile")');
    
    // Update name
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    
    // Update bio
    await page.fill('textarea[name="bio"]', 'Software engineer with 5 years experience');
    
    // Save changes
    await page.click('button:has-text("Save Changes")');
    
    // Check success message
    await expect(page.getByText('Profile updated successfully')).toBeVisible();
  });

  test('should update security settings', async ({ page }) => {
    await page.goto('/settings');
    await page.click('button:has-text("Security")');
    
    // Check security options
    await expect(page.locator('input[type="checkbox"][name="twoFactor"]')).toBeVisible();
    await expect(page.locator('button:has-text("Change Password")')).toBeVisible();
    await expect(page.locator('button:has-text("Enable 2FA")')).toBeVisible();
    
    // Test password change
    await page.click('button:has-text("Change Password")');
    
    // Fill password form
    await page.fill('input[name="currentPassword"]', 'testpassword123');
    await page.fill('input[name="newPassword"]', 'newpassword123');
    await page.fill('input[name="confirmPassword"]', 'newpassword123');
    
    // Submit form
    await page.click('button:has-text("Update Password")');
    
    // Check success message
    await expect(page.getByText('Password updated successfully')).toBeVisible();
  });

  test('should update preferences settings', async ({ page }) => {
    await page.goto('/settings');
    await page.click('button:has-text("Preferences")');
    
    // Check preference options
    await expect(page.locator('select[name="theme"]')).toBeVisible();
    await expect(page.locator('select[name="language"]')).toBeVisible();
    await expect(page.locator('select[name="timezone"]')).toBeVisible();
    
    // Update theme
    await page.selectOption('select[name="theme"]', 'dark');
    
    // Update language
    await page.selectOption('select[name="language"]', 'en-GB');
    
    // Save changes
    await page.click('button:has-text("Save Preferences")');
    
    // Check success message
    await expect(page.getByText('Preferences updated successfully')).toBeVisible();
  });

  test('should update autofill settings', async ({ page }) => {
    await page.goto('/settings');
    await page.click('button:has-text("Autofill")');
    
    // Check autofill options
    await expect(page.locator('input[type="checkbox"][name="enableAutofill"]')).toBeVisible();
    await expect(page.locator('button:has-text("Edit Profile")')).toBeVisible();
    
    // Enable autofill
    await page.check('input[type="checkbox"][name="enableAutofill"]');
    
    // Edit profile
    await page.click('button:has-text("Edit Profile")');
    
    // Fill profile form
    await page.fill('input[name="phone"]', '+1234567890');
    await page.fill('input[name="address"]', '123 Test Street');
    await page.fill('input[name="linkedIn"]', 'https://linkedin.com/in/test');
    
    // Save profile
    await page.click('button:has-text("Save Profile")');
    
    // Check success message
    await expect(page.getByText('Autofill profile updated')).toBeVisible();
  });

  test('should update features settings', async ({ page }) => {
    await page.goto('/settings');
    await page.click('button:has-text("Features")');
    
    // Check feature toggles
    await expect(page.locator('input[type="checkbox"][name="jobAlerts"]')).toBeVisible();
    await expect(page.locator('input[type="checkbox"][name="newsletter"]')).toBeVisible();
    await expect(page.locator('input[type="checkbox"][name="analytics"]')).toBeVisible();
    
    // Toggle features
    await page.check('input[type="checkbox"][name="jobAlerts"]');
    await page.check('input[type="checkbox"][name="newsletter"]');
    await page.uncheck('input[type="checkbox"][name="analytics"]');
    
    // Save changes
    await page.click('button:has-text("Save Features")');
    
    // Check success message
    await expect(page.getByText('Features updated successfully')).toBeVisible();
  });

  test('should export settings', async ({ page }) => {
    await page.goto('/settings');
    
    // Click export button
    await page.click('button:has-text("Export Settings")');
    
    // Check for export options
    await expect(page.locator('[data-testid="export-modal"]')).toBeVisible();
    
    // Select JSON export
    await page.click('button:has-text("Export as JSON")');
    
    // Check for download initiation
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Download")');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.json');
  });

  test('should import settings', async ({ page }) => {
    await page.goto('/settings');
    
    // Click import button
    await page.click('button:has-text("Import Settings")');
    
    // Check for import modal
    await expect(page.locator('[data-testid="import-modal"]')).toBeVisible();
    
    // Upload settings file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('test-settings.json');
    
    // Import settings
    await page.click('button:has-text("Import")');
    
    // Check success message
    await expect(page.getByText('Settings imported successfully')).toBeVisible();
  });

  test('should reset settings to defaults', async ({ page }) => {
    await page.goto('/settings');
    
    // Click reset button
    await page.click('button:has-text("Reset to Defaults")');
    
    // Confirm reset
    await page.click('button:has-text("Reset")');
    
    // Check success message
    await expect(page.getByText('Settings reset to defaults')).toBeVisible();
  });

  test('should manage sessions', async ({ page }) => {
    await page.goto('/settings');
    await page.click('button:has-text("Security")');
    
    // Check for session management
    await expect(page.locator('[data-testid="active-sessions"]')).toBeVisible();
    
    // Revoke all sessions
    await page.click('button:has-text("Revoke All Sessions")');
    
    // Confirm revocation
    await page.click('button:has-text("Revoke")');
    
    // Check success message
    await expect(page.getByText('All sessions revoked')).toBeVisible();
  });

  test('should delete account', async ({ page }) => {
    await page.goto('/settings');
    await page.click('button:has-text("Security")');
    
    // Click delete account button
    await page.click('button:has-text("Delete Account")');
    
    // Check for delete confirmation modal
    await expect(page.locator('[data-testid="delete-account-modal"]')).toBeVisible();
    
    // Type confirmation
    await page.fill('input[name="deleteConfirmation"]', 'DELETE');
    
    // Confirm deletion
    await page.click('button:has-text("Delete Account")');
    
    // Check success message
    await expect(page.getByText('Account deleted successfully')).toBeVisible();
  });

  test('should handle notification settings', async ({ page }) => {
    await page.goto('/settings');
    await page.click('button:has-text("Preferences")');
    
    // Check notification options
    await expect(page.locator('input[type="checkbox"][name="emailNotifications"]')).toBeVisible();
    await expect(page.locator('input[type="checkbox"][name="pushNotifications"]')).toBeVisible();
    await expect(page.locator('input[type="checkbox"][name="smsNotifications"]')).toBeVisible();
    
    // Toggle notifications
    await page.check('input[type="checkbox"][name="emailNotifications"]');
    await page.uncheck('input[type="checkbox"][name="pushNotifications"]');
    await page.check('input[type="checkbox"][name="smsNotifications"]');
    
    // Save changes
    await page.click('button:has-text("Save Preferences")');
    
    // Check success message
    await expect(page.getByText('Preferences updated successfully')).toBeVisible();
  });

  test('should handle privacy settings', async ({ page }) => {
    await page.goto('/settings');
    await page.click('button:has-text("Security")');
    
    // Check privacy options
    await expect(page.locator('input[type="checkbox"][name="publicProfile"]')).toBeVisible();
    await expect(page.locator('input[type="checkbox"][name="showEmail"]')).toBeVisible();
    await expect(page.locator('input[type="checkbox"][name="showPhone"]')).toBeVisible();
    
    // Toggle privacy settings
    await page.uncheck('input[type="checkbox"][name="publicProfile"]');
    await page.uncheck('input[type="checkbox"][name="showEmail"]');
    await page.check('input[type="checkbox"][name="showPhone"]');
    
    // Save changes
    await page.click('button:has-text("Save Security")');
    
    // Check success message
    await expect(page.getByText('Security settings updated')).toBeVisible();
  });

  test('should validate form inputs', async ({ page }) => {
    await page.goto('/settings');
    await page.click('button:has-text("Profile")');
    
    // Test email validation
    await page.fill('input[name="email"]', 'invalid-email');
    await page.click('button:has-text("Save Changes")');
    
    // Check error message
    await expect(page.getByText('Please enter a valid email')).toBeVisible();
    
    // Test password mismatch
    await page.click('button:has-text("Security")');
    await page.click('button:has-text("Change Password")');
    
    await page.fill('input[name="newPassword"]', 'newpassword123');
    await page.fill('input[name="confirmPassword"]', 'differentpassword');
    await page.click('button:has-text("Update Password")');
    
    // Check error message
    await expect(page.getByText('Passwords do not match')).toBeVisible();
  });

  test('should require authentication', async ({ page }) => {
    // Sign out first
    await page.goto('/sign-in');
    await page.click('button:has-text("Sign Out")');
    
    // Try to access settings
    await page.goto('/settings');
    
    // Should redirect to sign in
    await expect(page).toHaveURL('/sign-in');
  });

  test('should handle loading states', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/settings/**', route => {
      setTimeout(() => route.continue(), 2000);
    });
    
    await page.goto('/settings');
    
    // Check for loading state
    await expect(page.locator('[data-testid="loading-skeleton"]')).toBeVisible();
    
    // Wait for loading to complete
    await page.waitForSelector('[data-testid="settings-tabs"]', { timeout: 5000 });
  });
});
