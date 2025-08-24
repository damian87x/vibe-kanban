/**
 * E2E BDD Test Template
 * 
 * Usage: Copy this template when creating E2E tests for user journeys
 * Location: e2e/integration/journeys/[feature].spec.ts
 * Naming: Use descriptive names like "workflow-creation.spec.ts"
 */

import { test, expect, Page } from '@playwright/test';
import { createBDDHelpers } from '../helpers/bdd-helpers';

/**
 * Test Configuration
 */
test.describe.configure({ mode: 'parallel' }); // Run tests in parallel

/**
 * Feature: [Feature Name]
 * As a [user type]
 * I want to [action]
 * So that [benefit]
 */
test.describe('[Feature Name] Journey', () => {
  // Shared test data
  const testData = {
    validInput: {
      name: 'Test Name',
      description: 'Test Description',
      // Add more test data
    },
    invalidInput: {
      name: '', // Empty required field
      description: 'a'.repeat(1001), // Exceeds max length
    },
  };

  // Setup before each test
  test.beforeEach(async ({ page }) => {
    // Reset to clean state if needed
    // await resetDatabase();
    // await seedTestData();
  });

  // Cleanup after each test
  test.afterEach(async ({ page }) => {
    // Clean up test data if needed
    // await cleanupTestData();
  });

  /**
   * Scenario 1: Happy Path - Successful [Action]
   */
  test('User can successfully [complete primary action]', async ({ page }) => {
    const bdd = createBDDHelpers(page);

    // Given - Initial state/preconditions
    await test.step('Given: User is authenticated and on the correct page', async () => {
      await bdd.givenUserIsLoggedIn();
      await bdd.givenUserIsOnPage('/[feature-page]');
      // Add more preconditions
    });

    // When - User performs actions
    await test.step('When: User performs the primary action', async () => {
      await bdd.whenUserClicksButton('Create New');
      await bdd.whenUserFillsForm(testData.validInput);
      await bdd.whenUserClicksButton('Save');
      // Add more actions
    });

    // Then - Expected outcomes
    await test.step('Then: Action completes successfully', async () => {
      await bdd.thenUserShouldSeeText('Successfully created');
      await bdd.thenUserShouldBeOnPage('/[success-page]');
      await bdd.thenDataShouldBeSaved('[entity]', testData.validInput);
      // Add more assertions
    });

    // And - Additional outcomes (optional)
    await test.step('And: Related features work correctly', async () => {
      await bdd.thenUserCanAccessCreatedItem();
      await bdd.thenNotificationIsShown('success');
    });
  });

  /**
   * Scenario 2: Validation - Invalid Input Handling
   */
  test('User sees validation errors for invalid input', async ({ page }) => {
    const bdd = createBDDHelpers(page);

    // Given
    await test.step('Given: User is on the form page', async () => {
      await bdd.givenUserIsLoggedIn();
      await bdd.givenUserIsOnPage('/[feature-page]');
    });

    // When
    await test.step('When: User submits invalid data', async () => {
      await bdd.whenUserClicksButton('Create New');
      await bdd.whenUserFillsForm(testData.invalidInput);
      await bdd.whenUserClicksButton('Save');
    });

    // Then
    await test.step('Then: Validation errors are displayed', async () => {
      await bdd.thenUserShouldSeeText('Name is required');
      await bdd.thenUserShouldSeeText('Description is too long');
      await bdd.thenFormShouldNotBeSubmitted();
      await bdd.thenUserShouldStayOnPage('/[feature-page]');
    });
  });

  /**
   * Scenario 3: Error Recovery - Network Failure
   */
  test('User can recover from network errors', async ({ page }) => {
    const bdd = createBDDHelpers(page);

    // Given
    await test.step('Given: Network will fail on first attempt', async () => {
      await bdd.givenUserIsLoggedIn();
      await bdd.givenNetworkWillFail('/api/[endpoint]', 1); // Fail once
      await bdd.givenUserIsOnPage('/[feature-page]');
    });

    // When
    await test.step('When: User attempts action that fails', async () => {
      await bdd.whenUserFillsForm(testData.validInput);
      await bdd.whenUserClicksButton('Save');
    });

    // Then
    await test.step('Then: Error is handled gracefully', async () => {
      await bdd.thenUserShouldSeeText('Network error. Please try again.');
      await bdd.thenErrorIsLogged('NetworkError');
    });

    // When
    await test.step('When: User retries the action', async () => {
      await bdd.whenUserClicksButton('Retry');
    });

    // Then
    await test.step('Then: Action succeeds on retry', async () => {
      await bdd.thenUserShouldSeeText('Successfully created');
      await bdd.thenDataShouldBeSaved('[entity]', testData.validInput);
    });
  });

  /**
   * Scenario 4: Edge Case - Boundary Conditions
   */
  test('System handles edge cases correctly', async ({ page }) => {
    const bdd = createBDDHelpers(page);

    // Test maximum allowed values
    await test.step('Maximum values are accepted', async () => {
      await bdd.givenUserIsLoggedIn();
      await bdd.givenUserIsOnPage('/[feature-page]');
      
      const maxData = {
        name: 'a'.repeat(100), // Max length
        count: 999999, // Max number
      };
      
      await bdd.whenUserFillsForm(maxData);
      await bdd.whenUserClicksButton('Save');
      await bdd.thenUserShouldSeeText('Successfully created');
    });

    // Test minimum allowed values
    await test.step('Minimum values are accepted', async () => {
      const minData = {
        name: 'a', // Min length
        count: 1, // Min number
      };
      
      await bdd.whenUserFillsForm(minData);
      await bdd.whenUserClicksButton('Save');
      await bdd.thenUserShouldSeeText('Successfully created');
    });
  });

  /**
   * Scenario 5: Concurrent Operations
   */
  test('System handles concurrent operations correctly', async ({ browser }) => {
    // Create multiple browser contexts for concurrent users
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    const bdd1 = createBDDHelpers(page1);
    const bdd2 = createBDDHelpers(page2);

    // Both users perform actions simultaneously
    await test.step('Two users create items simultaneously', async () => {
      // User 1
      await bdd1.givenUserIsLoggedIn('user1@test.com');
      await bdd1.givenUserIsOnPage('/[feature-page]');
      
      // User 2
      await bdd2.givenUserIsLoggedIn('user2@test.com');
      await bdd2.givenUserIsOnPage('/[feature-page]');
      
      // Both create items at the same time
      await Promise.all([
        bdd1.whenUserCreatesItem({ name: 'Item 1' }),
        bdd2.whenUserCreatesItem({ name: 'Item 2' }),
      ]);
      
      // Both should succeed
      await bdd1.thenUserShouldSeeText('Successfully created');
      await bdd2.thenUserShouldSeeText('Successfully created');
    });

    // Cleanup
    await context1.close();
    await context2.close();
  });

  /**
   * Scenario 6: Performance Under Load
   */
  test('Feature performs well under load', async ({ page }) => {
    const bdd = createBDDHelpers(page);

    await test.step('Given: Large dataset exists', async () => {
      await bdd.givenUserIsLoggedIn();
      await bdd.givenLargeDatasetExists(1000); // 1000 items
      await bdd.givenUserIsOnPage('/[feature-page]');
    });

    await test.step('When: User loads the page', async () => {
      const startTime = Date.now();
      await page.reload();
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      // Then: Page loads within acceptable time
      expect(loadTime).toBeLessThan(3000); // 3 seconds
    });

    await test.step('When: User searches through data', async () => {
      const startTime = Date.now();
      await bdd.whenUserSearchesFor('test query');
      const searchTime = Date.now() - startTime;
      
      // Then: Search completes quickly
      expect(searchTime).toBeLessThan(500); // 500ms
      await bdd.thenSearchResultsAreDisplayed();
    });
  });

  /**
   * Scenario 7: Accessibility Compliance
   */
  test('Feature is accessible to all users', async ({ page }) => {
    const bdd = createBDDHelpers(page);

    await test.step('Given: User relies on keyboard navigation', async () => {
      await bdd.givenUserIsLoggedIn();
      await bdd.givenUserIsOnPage('/[feature-page]');
    });

    await test.step('When: User navigates with keyboard only', async () => {
      // Tab through interactive elements
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toHaveAttribute('aria-label');
      
      // Activate button with Enter
      await page.keyboard.press('Enter');
      
      // Navigate with arrow keys
      await page.keyboard.press('ArrowDown');
    });

    await test.step('Then: All functions are accessible', async () => {
      // Check ARIA attributes
      await expect(page.locator('button')).toHaveAttribute('aria-label');
      await expect(page.locator('[role="navigation"]')).toBeVisible();
      
      // Check focus indicators
      await expect(page.locator(':focus')).toHaveCSS('outline-width', '2px');
      
      // Check color contrast (requires axe-core)
      // await checkA11y(page);
    });
  });

  /**
   * Scenario 8: Mobile Responsiveness
   */
  test('Feature works on mobile devices', async ({ page, browser }) => {
    // Create mobile context
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 667 }, // iPhone size
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
    });
    
    const mobilePage = await mobileContext.newPage();
    const bdd = createBDDHelpers(mobilePage);

    await test.step('Given: User is on mobile device', async () => {
      await bdd.givenUserIsLoggedIn();
      await bdd.givenUserIsOnPage('/[feature-page]');
    });

    await test.step('When: User interacts with mobile UI', async () => {
      // Check mobile menu
      await bdd.whenUserClicksButton('☰'); // Hamburger menu
      await expect(mobilePage.locator('.mobile-menu')).toBeVisible();
      
      // Check touch interactions
      await bdd.whenUserSwipesLeft('.carousel');
    });

    await test.step('Then: Mobile experience is optimized', async () => {
      // Check responsive layout
      await expect(mobilePage.locator('.container')).toHaveCSS('padding', '16px');
      
      // Check touch targets are large enough
      const buttons = await mobilePage.locator('button').all();
      for (const button of buttons) {
        const box = await button.boundingBox();
        expect(box?.width).toBeGreaterThanOrEqual(44); // iOS minimum
        expect(box?.height).toBeGreaterThanOrEqual(44);
      }
    });

    await mobileContext.close();
  });

  /**
   * Scenario 9: Data Persistence
   */
  test('User data persists correctly', async ({ page, context }) => {
    const bdd = createBDDHelpers(page);

    await test.step('Given: User creates data', async () => {
      await bdd.givenUserIsLoggedIn();
      await bdd.givenUserIsOnPage('/[feature-page]');
      await bdd.whenUserCreatesItem(testData.validInput);
      await bdd.thenUserShouldSeeText('Successfully created');
    });

    await test.step('When: User logs out and back in', async () => {
      await bdd.whenUserLogsOut();
      await context.clearCookies();
      await bdd.givenUserIsLoggedIn();
      await bdd.givenUserIsOnPage('/[feature-page]');
    });

    await test.step('Then: Data is still present', async () => {
      await bdd.thenUserShouldSeeText(testData.validInput.name);
      await bdd.thenDataExistsInDatabase('[entity]', testData.validInput);
    });
  });

  /**
   * Scenario 10: Security - Authorization
   */
  test('Feature enforces proper authorization', async ({ page }) => {
    const bdd = createBDDHelpers(page);

    await test.step('Given: Unauthenticated user attempts access', async () => {
      await page.goto('/[feature-page]');
    });

    await test.step('Then: User is redirected to login', async () => {
      await bdd.thenUserShouldBeOnPage('/login');
      await bdd.thenUserShouldSeeText('Please log in to continue');
    });

    await test.step('Given: User with insufficient permissions', async () => {
      await bdd.givenUserIsLoggedIn('limited@test.com', 'password123');
      await page.goto('/[admin-feature]');
    });

    await test.step('Then: Access is denied', async () => {
      await bdd.thenUserShouldSeeText('Access denied');
      await bdd.thenUserShouldBeOnPage('/unauthorized');
    });
  });
});

/**
 * Visual Regression Tests (Optional)
 */
test.describe('Visual Regression', () => {
  test('Feature appearance matches baseline', async ({ page }) => {
    const bdd = createBDDHelpers(page);
    
    await bdd.givenUserIsLoggedIn();
    await bdd.givenUserIsOnPage('/[feature-page]');
    
    // Take screenshot for comparison
    await expect(page).toHaveScreenshot('[feature]-desktop.png', {
      fullPage: true,
      animations: 'disabled',
    });
    
    // Test specific component
    await expect(page.locator('.feature-component')).toHaveScreenshot(
      '[feature]-component.png'
    );
  });
});