import { Page, expect } from '@playwright/test';
import { randomUUID } from 'crypto';

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Navigate to a page and wait for it to load
   */
  async navigateTo(path: string) {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Complete the onboarding flow if it appears
   */
  async completeOnboardingIfNeeded() {
    try {
      // Check if disclaimer dialog appears
      const disclaimerDialog = this.page.locator('text=Important Disclaimer');
      if (await disclaimerDialog.isVisible({ timeout: 5000 })) {
        await this.page.click('button:has-text("I Understand and Accept")');
        await this.page.waitForTimeout(500);
      }

      // Check if onboarding dialog appears
      const onboardingDialog = this.page.locator('text=Welcome to Vibe Kanban');
      if (await onboardingDialog.isVisible({ timeout: 5000 })) {
        // Select profile
        await this.page.click('button:has-text("claude-code")');
        await this.page.click('button:has-text("Continue")');
        
        // Select editor
        await this.page.click('button:has-text("VS Code")');
        await this.page.click('button:has-text("Complete Setup")');
        await this.page.waitForTimeout(500);
      }

      // Check for GitHub login dialog
      const githubDialog = this.page.locator('text=Connect GitHub Account');
      if (await githubDialog.isVisible({ timeout: 5000 })) {
        await this.page.click('button:has-text("Skip")');
        await this.page.waitForTimeout(500);
      }

      // Check for privacy opt-in
      const privacyDialog = this.page.locator('text=Privacy & Analytics');
      if (await privacyDialog.isVisible({ timeout: 5000 })) {
        await this.page.click('button:has-text("No Thanks")');
        await this.page.waitForTimeout(500);
      }
    } catch (error) {
      // Onboarding might have been completed already
      console.log('Onboarding already completed or not needed');
    }
  }

  /**
   * Create a new project with a random name
   */
  async createProject(name?: string): Promise<string> {
    const projectName = name || `test-project-${randomUUID().slice(0, 8)}`;
    
    await this.navigateTo('/projects');
    await this.page.click('button:has-text("New Project")');
    
    // Fill in project details
    await this.page.fill('input[placeholder*="project name"]', projectName);
    await this.page.fill('input[placeholder*="repository path"]', `/tmp/${projectName}`);
    
    // Submit the form
    await this.page.click('button:has-text("Create")');
    
    // Wait for navigation to project page
    await this.page.waitForURL(/\/projects\/[a-f0-9-]+\/tasks/);
    
    return projectName;
  }

  /**
   * Create a new task
   */
  async createTask(title: string, description?: string): Promise<void> {
    await this.page.click('button:has-text("New Task")');
    
    // Fill in task details
    await this.page.fill('input[placeholder*="task title"]', title);
    
    if (description) {
      await this.page.fill('textarea[placeholder*="description"]', description);
    }
    
    // Submit the form
    await this.page.click('button:has-text("Create Task")');
    
    // Wait for the task to appear
    await this.page.waitForSelector(`text=${title}`, { timeout: 5000 });
  }

  /**
   * Navigate to orchestrator page
   */
  async navigateToOrchestrator() {
    await this.page.click('a[href="/orchestrator"]');
    await this.page.waitForURL('**/orchestrator');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for a task to appear in orchestrator
   */
  async waitForTaskInOrchestrator(taskTitle: string, timeout = 60000) {
    await this.page.waitForSelector(`text=${taskTitle}`, { timeout });
  }

  /**
   * Get orchestrator status
   */
  async getOrchestratorStatus() {
    const activeTasksCount = await this.page.locator('.active-tasks-count').textContent();
    const queuedTasksCount = await this.page.locator('.queued-tasks-count').textContent();
    const containers = await this.page.locator('.container-status').all();
    
    return {
      activeTasks: parseInt(activeTasksCount || '0'),
      queuedTasks: parseInt(queuedTasksCount || '0'),
      containersCount: containers.length
    };
  }

  /**
   * Wait for task to reach a specific stage
   */
  async waitForTaskStage(taskTitle: string, stage: string, timeout = 120000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const taskElement = this.page.locator(`text=${taskTitle}`).first();
      
      if (await taskElement.isVisible()) {
        const stageElement = taskElement.locator('..').locator(`text=${stage}`);
        if (await stageElement.isVisible()) {
          return true;
        }
      }
      
      // Refresh the page to get latest status
      await this.page.reload();
      await this.page.waitForTimeout(5000);
    }
    
    throw new Error(`Task "${taskTitle}" did not reach stage "${stage}" within ${timeout}ms`);
  }

  /**
   * Get task stage outputs
   */
  async getTaskStageOutputs(taskTitle: string) {
    // Click on View Details for the task
    const taskRow = this.page.locator(`text=${taskTitle}`).locator('..');
    await taskRow.locator('button:has-text("View Details")').click();
    
    // Wait for modal to appear
    await this.page.waitForSelector('.fixed.inset-0');
    
    // Get outputs from each tab
    const outputs: Record<string, string | null> = {};
    
    // Get specification output
    await this.page.click('button[role="tab"]:has-text("Specification")');
    await this.page.waitForTimeout(500);
    const specOutput = await this.page.locator('pre').first().textContent();
    outputs.specification = specOutput;
    
    // Get implementation output
    await this.page.click('button[role="tab"]:has-text("Implementation")');
    await this.page.waitForTimeout(500);
    const implOutput = await this.page.locator('pre').first().textContent();
    outputs.implementation = implOutput;
    
    // Get review output
    await this.page.click('button[role="tab"]:has-text("Review")');
    await this.page.waitForTimeout(500);
    const reviewOutput = await this.page.locator('pre').first().textContent();
    outputs.review = reviewOutput;
    
    // Close modal
    await this.page.click('button:has-text("Close")');
    
    return outputs;
  }

  /**
   * Retry a task from a specific stage
   */
  async retryTaskFromStage(taskTitle: string, stage: 'specification' | 'implementation' | 'review_qa') {
    // Click on View Details for the task
    const taskRow = this.page.locator(`text=${taskTitle}`).locator('..');
    await taskRow.locator('button:has-text("View Details")').click();
    
    // Wait for modal to appear
    await this.page.waitForSelector('.fixed.inset-0');
    
    // Navigate to the appropriate tab
    const tabName = stage === 'review_qa' ? 'Review' : stage.charAt(0).toUpperCase() + stage.slice(1);
    await this.page.click(`button[role="tab"]:has-text("${tabName}")`);
    
    // Click retry button
    await this.page.click(`button:has-text("Retry")`);
    
    // Close modal if it's still open
    try {
      await this.page.click('button:has-text("Close")', { timeout: 2000 });
    } catch {
      // Modal might have closed automatically
    }
  }

  /**
   * Check container allocation
   */
  async getContainerStatus(): Promise<Array<{ id: number; status: string }>> {
    const containers: Array<{ id: number; status: string }> = [];
    
    for (let i = 1; i <= 3; i++) {
      const containerElement = this.page.locator(`text=Container ${i}`).locator('..');
      const statusBadge = await containerElement.locator('.badge, [class*="badge"]').textContent();
      containers.push({
        id: i,
        status: statusBadge?.toLowerCase() || 'unknown'
      });
    }
    
    return containers;
  }

  /**
   * Wait for container to be allocated
   */
  async waitForContainerAllocation(timeout = 60000): Promise<number> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const containers = await this.getContainerStatus();
      const busyContainer = containers.find(c => c.status === 'busy');
      
      if (busyContainer) {
        return busyContainer.id;
      }
      
      await this.page.waitForTimeout(2000);
    }
    
    throw new Error(`No container was allocated within ${timeout}ms`);
  }

  /**
   * Clean up test data
   */
  async cleanup() {
    // Navigate to settings to clear any test data if needed
    await this.navigateTo('/settings');
    // Additional cleanup logic can be added here
  }
}