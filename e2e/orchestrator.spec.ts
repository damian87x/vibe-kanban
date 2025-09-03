import { test, expect } from '@playwright/test';
import { TestHelpers } from './helpers/test-helpers';

test.describe('Orchestrator E2E Tests', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.navigateTo('/');
    await helpers.completeOnboardingIfNeeded();
  });

  test('should display orchestrator dashboard with container status', async ({ page }) => {
    // Navigate to orchestrator
    await helpers.navigateToOrchestrator();
    
    // Verify page title and description
    await expect(page.locator('h1')).toContainText('Orchestrator Dashboard');
    await expect(page.locator('text=Monitor and manage task orchestration')).toBeVisible();
    
    // Verify containers are displayed
    const containers = await helpers.getContainerStatus();
    expect(containers).toHaveLength(3);
    
    // All containers should be available initially
    for (const container of containers) {
      expect(['available', 'busy']).toContain(container.status);
    }
  });

  test('should process task through all orchestration stages', async ({ page }) => {
    // Create a project first
    const projectName = await helpers.createProject();
    console.log(`Created project: ${projectName}`);
    
    // Create a task
    const taskTitle = `Orchestrator Test Task ${Date.now()}`;
    const taskDescription = 'Test task for orchestrator: Build a simple REST API';
    await helpers.createTask(taskTitle, taskDescription);
    console.log(`Created task: ${taskTitle}`);
    
    // Navigate to orchestrator
    await helpers.navigateToOrchestrator();
    
    // Wait for task to appear in orchestrator
    await helpers.waitForTaskInOrchestrator(taskTitle);
    console.log('Task appeared in orchestrator');
    
    // Verify task progresses through stages
    const stages = ['specification', 'implementation', 'review_qa', 'completed'];
    
    for (const stage of stages) {
      console.log(`Waiting for stage: ${stage}`);
      await helpers.waitForTaskStage(taskTitle, stage, 180000); // 3 minutes per stage
      console.log(`Task reached stage: ${stage}`);
      
      // Give some time for the stage to execute
      await page.waitForTimeout(5000);
    }
    
    // Verify stage outputs were generated
    const outputs = await helpers.getTaskStageOutputs(taskTitle);
    
    expect(outputs.specification).toBeTruthy();
    expect(outputs.specification).toContain('specification');
    
    expect(outputs.implementation).toBeTruthy();
    expect(outputs.implementation).toContain('implementation');
    
    expect(outputs.review).toBeTruthy();
    expect(outputs.review).toContain('review');
  });

  test('should allocate and release containers correctly', async ({ page }) => {
    // Create multiple tasks to test container allocation
    const projectName = await helpers.createProject();
    
    // Create 3 tasks (should use all containers)
    const tasks = [];
    for (let i = 1; i <= 3; i++) {
      const taskTitle = `Container Test ${i} - ${Date.now()}`;
      await helpers.createTask(taskTitle, `Testing container allocation ${i}`);
      tasks.push(taskTitle);
      await page.waitForTimeout(1000); // Small delay between task creation
    }
    
    // Navigate to orchestrator
    await helpers.navigateToOrchestrator();
    
    // Wait for containers to be allocated
    await page.waitForTimeout(35000); // Wait for orchestrator to pick up tasks (30s poll + buffer)
    
    // Check container status
    const containers = await helpers.getContainerStatus();
    const busyContainers = containers.filter(c => c.status === 'busy');
    
    // Should have at least 2 busy containers (max concurrent is 2)
    expect(busyContainers.length).toBeGreaterThanOrEqual(2);
    expect(busyContainers.length).toBeLessThanOrEqual(3);
    
    // Verify active tasks are shown
    const activeTasksText = await page.locator('text=Active Tasks').locator('..').textContent();
    expect(activeTasksText).toContain('running');
  });

  test('should handle task retry from specific stage', async ({ page }) => {
    // Create a project and task
    const projectName = await helpers.createProject();
    const taskTitle = `Retry Test Task ${Date.now()}`;
    await helpers.createTask(taskTitle, 'Test task for retry functionality');
    
    // Navigate to orchestrator
    await helpers.navigateToOrchestrator();
    
    // Wait for task to reach implementation stage
    await helpers.waitForTaskStage(taskTitle, 'implementation', 120000);
    
    // Retry from specification stage
    await helpers.retryTaskFromStage(taskTitle, 'specification');
    
    // Wait for the task to restart from specification
    await page.waitForTimeout(35000); // Wait for orchestrator poll
    
    // Verify task is back in specification stage
    await helpers.waitForTaskStage(taskTitle, 'specification', 60000);
    
    // Verify it progresses again
    await helpers.waitForTaskStage(taskTitle, 'implementation', 120000);
  });

  test('should show queued tasks when containers are busy', async ({ page }) => {
    // Create a project
    const projectName = await helpers.createProject();
    
    // Create more tasks than available containers
    const tasks = [];
    for (let i = 1; i <= 5; i++) {
      const taskTitle = `Queue Test ${i} - ${Date.now()}`;
      await helpers.createTask(taskTitle, `Testing task queue ${i}`);
      tasks.push(taskTitle);
      await page.waitForTimeout(500);
    }
    
    // Navigate to orchestrator
    await helpers.navigateToOrchestrator();
    
    // Wait for orchestrator to process
    await page.waitForTimeout(35000);
    
    // Check queued tasks section
    const queuedSection = page.locator('text=Queued Tasks').locator('..');
    const queuedCount = await queuedSection.locator('text=waiting').textContent();
    
    // Should have at least 2 tasks queued (5 tasks - 2 max concurrent - 1 possible completed)
    expect(parseInt(queuedCount?.match(/\d+/)?.[0] || '0')).toBeGreaterThanOrEqual(2);
    
    // Verify queued tasks are displayed
    const queuedTaskElements = await queuedSection.locator('.border.rounded').count();
    expect(queuedTaskElements).toBeGreaterThan(0);
  });

  test('should persist stage outputs and context between stages', async ({ page }) => {
    // Create a project and task
    const projectName = await helpers.createProject();
    const taskTitle = `Context Test ${Date.now()}`;
    const taskDescription = 'Build a user authentication system with JWT';
    await helpers.createTask(taskTitle, taskDescription);
    
    // Navigate to orchestrator
    await helpers.navigateToOrchestrator();
    
    // Wait for specification to complete
    await helpers.waitForTaskStage(taskTitle, 'implementation', 120000);
    
    // Get stage outputs
    const outputs = await helpers.getTaskStageOutputs(taskTitle);
    
    // Verify specification output exists
    expect(outputs.specification).toBeTruthy();
    console.log('Specification output:', outputs.specification?.substring(0, 200));
    
    // Wait for implementation to complete
    await helpers.waitForTaskStage(taskTitle, 'review_qa', 120000);
    
    // Get updated outputs
    const updatedOutputs = await helpers.getTaskStageOutputs(taskTitle);
    
    // Verify implementation built on specification
    expect(updatedOutputs.implementation).toBeTruthy();
    expect(updatedOutputs.specification).toBe(outputs.specification); // Should persist
    console.log('Implementation output:', updatedOutputs.implementation?.substring(0, 200));
    
    // Wait for review to complete
    await helpers.waitForTaskStage(taskTitle, 'completed', 120000);
    
    // Get final outputs
    const finalOutputs = await helpers.getTaskStageOutputs(taskTitle);
    
    // All stages should have outputs
    expect(finalOutputs.specification).toBeTruthy();
    expect(finalOutputs.implementation).toBeTruthy();
    expect(finalOutputs.review).toBeTruthy();
  });

  test('should update task status correctly through stages', async ({ page }) => {
    // Create a project and task
    const projectName = await helpers.createProject();
    const taskTitle = `Status Test ${Date.now()}`;
    await helpers.createTask(taskTitle, 'Test task status updates');
    
    // Verify initial status is 'todo'
    await page.goto(`/projects`);
    await page.click(`text=${projectName}`);
    let taskStatus = await page.locator(`text=${taskTitle}`).locator('..').locator('[class*="badge"]').textContent();
    expect(taskStatus?.toLowerCase()).toBe('todo');
    
    // Navigate to orchestrator
    await helpers.navigateToOrchestrator();
    
    // Wait for task to start processing
    await helpers.waitForTaskStage(taskTitle, 'specification', 60000);
    
    // Go back to project page and check status
    await page.goto(`/projects`);
    await page.click(`text=${projectName}`);
    taskStatus = await page.locator(`text=${taskTitle}`).locator('..').locator('[class*="badge"]').textContent();
    expect(taskStatus?.toLowerCase()).toBe('inprogress');
    
    // Wait for completion
    await helpers.navigateToOrchestrator();
    await helpers.waitForTaskStage(taskTitle, 'completed', 180000);
    
    // Final status should be 'done'
    await page.goto(`/projects`);
    await page.click(`text=${projectName}`);
    taskStatus = await page.locator(`text=${taskTitle}`).locator('..').locator('[class*="badge"]').textContent();
    expect(taskStatus?.toLowerCase()).toBe('done');
  });

  test('should handle multiple tasks in parallel', async ({ page }) => {
    // Create a project
    const projectName = await helpers.createProject();
    
    // Create 2 tasks (max concurrent)
    const task1 = `Parallel Task 1 - ${Date.now()}`;
    const task2 = `Parallel Task 2 - ${Date.now()}`;
    
    await helpers.createTask(task1, 'First parallel task');
    await helpers.createTask(task2, 'Second parallel task');
    
    // Navigate to orchestrator
    await helpers.navigateToOrchestrator();
    
    // Wait for orchestrator to pick up both tasks
    await page.waitForTimeout(35000);
    
    // Both tasks should be processing
    await expect(page.locator(`text=${task1}`)).toBeVisible();
    await expect(page.locator(`text=${task2}`)).toBeVisible();
    
    // Check active tasks count
    const activeTasksSection = page.locator('text=Active Tasks').locator('..');
    const activeCount = await activeTasksSection.textContent();
    expect(activeCount).toContain('2'); // Should show 2 running
    
    // Both should progress through stages
    await helpers.waitForTaskStage(task1, 'implementation', 120000);
    await helpers.waitForTaskStage(task2, 'implementation', 120000);
    
    // Verify containers are being used efficiently
    const containers = await helpers.getContainerStatus();
    const busyContainers = containers.filter(c => c.status === 'busy');
    expect(busyContainers.length).toBe(2); // Exactly 2 containers busy
  });

  test('should display progress indicators correctly', async ({ page }) => {
    // Create a project and task
    const projectName = await helpers.createProject();
    const taskTitle = `Progress Test ${Date.now()}`;
    await helpers.createTask(taskTitle, 'Test progress indicators');
    
    // Navigate to orchestrator
    await helpers.navigateToOrchestrator();
    
    // Wait for task to appear
    await helpers.waitForTaskInOrchestrator(taskTitle);
    
    // Find the task card
    const taskCard = page.locator(`text=${taskTitle}`).locator('../../..');
    
    // Check initial progress indicators (all should be gray/incomplete)
    const specIndicator = taskCard.locator('text=Specification').locator('..').locator('div[class*="rounded-full"]');
    const implIndicator = taskCard.locator('text=Implementation').locator('..').locator('div[class*="rounded-full"]');
    const reviewIndicator = taskCard.locator('text=Review & QA').locator('..').locator('div[class*="rounded-full"]');
    
    // Initially all should be gray (bg-gray-300)
    await expect(specIndicator).toHaveClass(/bg-gray-300/);
    await expect(implIndicator).toHaveClass(/bg-gray-300/);
    await expect(reviewIndicator).toHaveClass(/bg-gray-300/);
    
    // Wait for specification to complete
    await helpers.waitForTaskStage(taskTitle, 'implementation', 120000);
    await page.reload();
    
    // Specification should now be green
    await expect(taskCard.locator('text=Specification').locator('..').locator('div[class*="bg-green-500"]')).toBeVisible();
    
    // Wait for implementation to complete
    await helpers.waitForTaskStage(taskTitle, 'review_qa', 120000);
    await page.reload();
    
    // Implementation should now be green too
    await expect(taskCard.locator('text=Implementation').locator('..').locator('div[class*="bg-green-500"]')).toBeVisible();
    
    // Wait for review to complete
    await helpers.waitForTaskStage(taskTitle, 'completed', 120000);
    await page.reload();
    
    // All should be green now
    await expect(taskCard.locator('text=Specification').locator('..').locator('div[class*="bg-green-500"]')).toBeVisible();
    await expect(taskCard.locator('text=Implementation').locator('..').locator('div[class*="bg-green-500"]')).toBeVisible();
    await expect(taskCard.locator('text=Review & QA').locator('..').locator('div[class*="bg-green-500"]')).toBeVisible();
  });
});