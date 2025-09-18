import { test, expect } from '@playwright/test';

test.describe('Vitordo E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display main application layout', async ({ page }) => {
    // Check if main components are visible
    await expect(page.locator('[data-testid="left-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="right-panel"]')).toBeVisible();
    
    // Check for welcome message
    await expect(page.locator('text=Input,')).toBeVisible();
    await expect(page.locator('text=A\'ll be Scheduled!')).toBeVisible();
  });

  test('should handle task creation workflow', async ({ page }) => {
    // Fill in task input
    const taskInput = page.locator('[data-testid="task-input"]');
    await taskInput.fill('Create a meeting for tomorrow at 2 PM');
    
    // Submit the task
    const submitButton = page.locator('[data-testid="submit-button"]');
    await submitButton.click();
    
    // Wait for loading to complete
    await page.waitForSelector('[data-testid="loading-spinner"]', { state: 'hidden' });
    
    // Check if task appears in timeline
    await expect(page.locator('text=meeting')).toBeVisible();
  });

  test('should handle task status updates', async ({ page }) => {
    // First create a task
    await page.locator('[data-testid="task-input"]').fill('Test task for status update');
    await page.locator('[data-testid="submit-button"]').click();
    await page.waitForSelector('[data-testid="loading-spinner"]', { state: 'hidden' });
    
    // Find the task and open actions menu
    const taskElement = page.locator('[data-testid="timeline-event"]').first();
    const actionsButton = taskElement.locator('[data-testid="task-actions"]');
    await actionsButton.click();
    
    // Mark task as complete
    await page.locator('text=Mark Complete').click();
    
    // Verify status change
    await expect(taskElement.locator('[data-testid="status-ring"]')).toHaveClass(/green/);
  });

  test('should handle theme switching', async ({ page }) => {
    // Check initial theme (light)
    await expect(page.locator('html')).not.toHaveClass('dark');
    
    // Click theme toggle
    await page.locator('[data-testid="theme-toggle"]').click();
    
    // Should switch to dark theme
    await expect(page.locator('html')).toHaveClass('dark');
  });

  test('should handle error states', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/**', route => route.abort());
    
    // Try to create a task
    await page.locator('[data-testid="task-input"]').fill('This should fail');
    await page.locator('[data-testid="submit-button"]').click();
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if layout adapts
    await expect(page.locator('[data-testid="left-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="right-panel"]')).toBeVisible();
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="task-input"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="submit-button"]')).toBeFocused();
  });
});