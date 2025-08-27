import { test, expect } from '@playwright/test';
import { TestHelpers } from './helpers/test-helpers';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

test.describe('Orchestrator Database Integrity Tests', () => {
  let helpers: TestHelpers;
  let db: Database.Database;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.navigateTo('/');
    await helpers.completeOnboardingIfNeeded();
    
    // Connect to the dev database
    const dbPath = path.join(process.cwd(), 'dev_assets', 'db.sqlite');
    if (fs.existsSync(dbPath)) {
      db = new Database(dbPath, { readonly: true });
    }
  });

  test.afterEach(() => {
    if (db) {
      db.close();
    }
  });

  test('should correctly store orchestrator fields in database', async ({ page }) => {
    test.skip(!db, 'Database not available');
    
    // Create a project and task
    const projectName = await helpers.createProject();
    const taskTitle = `DB Test ${Date.now()}`;
    await helpers.createTask(taskTitle, 'Test database fields');
    
    // Get the task from database
    const task = db.prepare('SELECT * FROM tasks WHERE title = ?').get(taskTitle) as any;
    expect(task).toBeTruthy();
    
    // Verify orchestrator fields exist
    expect(task).toHaveProperty('orchestrator_stage');
    expect(task).toHaveProperty('orchestrator_context');
    expect(task).toHaveProperty('container_id');
    
    // Initially should be pending or null
    expect(['pending', null]).toContain(task.orchestrator_stage);
    expect(task.container_id).toBeNull();
    
    // Navigate to orchestrator and wait for processing
    await helpers.navigateToOrchestrator();
    await helpers.waitForTaskStage(taskTitle, 'specification', 60000);
    
    // Check database again
    const updatedTask = db.prepare('SELECT * FROM tasks WHERE title = ?').get(taskTitle) as any;
    expect(updatedTask.orchestrator_stage).toBe('specification');
    expect(updatedTask.container_id).toBeGreaterThanOrEqual(1);
    expect(updatedTask.container_id).toBeLessThanOrEqual(3);
    
    // Check orchestrator context is JSON
    if (updatedTask.orchestrator_context) {
      const context = JSON.parse(updatedTask.orchestrator_context);
      expect(context).toBeInstanceOf(Object);
    }
  });

  test('should store stage outputs in database', async ({ page }) => {
    test.skip(!db, 'Database not available');
    
    // Create a project and task
    const projectName = await helpers.createProject();
    const taskTitle = `Output DB Test ${Date.now()}`;
    await helpers.createTask(taskTitle, 'Test stage outputs storage');
    
    // Get the task ID
    const task = db.prepare('SELECT id FROM tasks WHERE title = ?').get(taskTitle) as any;
    expect(task).toBeTruthy();
    const taskId = task.id;
    
    // Navigate to orchestrator
    await helpers.navigateToOrchestrator();
    
    // Wait for specification to complete
    await helpers.waitForTaskStage(taskTitle, 'implementation', 120000);
    
    // Check stage outputs table
    const specOutput = db.prepare(
      'SELECT * FROM orchestrator_stage_outputs WHERE task_id = ? AND stage = ?'
    ).get(taskId, 'specification') as any;
    
    expect(specOutput).toBeTruthy();
    expect(specOutput.command_used).toContain('create-spec');
    expect(specOutput.output).toBeTruthy();
    expect(specOutput.success).toBe(1); // SQLite stores boolean as 0/1
    
    // Wait for implementation
    await helpers.waitForTaskStage(taskTitle, 'review_qa', 120000);
    
    // Check implementation output
    const implOutput = db.prepare(
      'SELECT * FROM orchestrator_stage_outputs WHERE task_id = ? AND stage = ?'
    ).get(taskId, 'implementation') as any;
    
    expect(implOutput).toBeTruthy();
    expect(implOutput.output).toBeTruthy();
    
    // Verify unique constraint (one output per stage per task)
    const outputCount = db.prepare(
      'SELECT COUNT(*) as count FROM orchestrator_stage_outputs WHERE task_id = ? AND stage = ?'
    ).get(taskId, 'specification') as any;
    
    expect(outputCount.count).toBe(1);
  });

  test('should maintain referential integrity', async ({ page }) => {
    test.skip(!db, 'Database not available');
    
    // Create a project and task
    const projectName = await helpers.createProject();
    const taskTitle = `Integrity Test ${Date.now()}`;
    await helpers.createTask(taskTitle, 'Test referential integrity');
    
    // Get task and project IDs
    const task = db.prepare('SELECT id, project_id FROM tasks WHERE title = ?').get(taskTitle) as any;
    expect(task).toBeTruthy();
    
    // Verify foreign key to project exists
    const project = db.prepare('SELECT id FROM projects WHERE id = ?').get(task.project_id) as any;
    expect(project).toBeTruthy();
    
    // Navigate to orchestrator and process task
    await helpers.navigateToOrchestrator();
    await helpers.waitForTaskStage(taskTitle, 'specification', 60000);
    
    // Check task attempts were created
    const attempts = db.prepare(
      'SELECT COUNT(*) as count FROM task_attempts WHERE task_id = ?'
    ).get(task.id) as any;
    
    expect(attempts.count).toBeGreaterThan(0);
    
    // Check that stage outputs reference valid task
    const outputs = db.prepare(
      'SELECT COUNT(*) as count FROM orchestrator_stage_outputs WHERE task_id = ?'
    ).get(task.id) as any;
    
    expect(outputs.count).toBeGreaterThan(0);
  });

  test('should handle concurrent updates correctly', async ({ page }) => {
    test.skip(!db, 'Database not available');
    
    // Create a project
    const projectName = await helpers.createProject();
    
    // Create multiple tasks
    const tasks = [];
    for (let i = 1; i <= 3; i++) {
      const taskTitle = `Concurrent DB Test ${i} - ${Date.now()}`;
      await helpers.createTask(taskTitle, `Concurrent test ${i}`);
      tasks.push(taskTitle);
    }
    
    // Navigate to orchestrator
    await helpers.navigateToOrchestrator();
    
    // Wait for processing to start
    await page.waitForTimeout(35000);
    
    // Check that different containers were allocated
    const containerAllocations = new Set();
    
    for (const taskTitle of tasks) {
      const task = db.prepare('SELECT container_id FROM tasks WHERE title = ?').get(taskTitle) as any;
      if (task && task.container_id !== null) {
        containerAllocations.add(task.container_id);
      }
    }
    
    // Should have at least 2 different containers allocated (max concurrent)
    expect(containerAllocations.size).toBeGreaterThanOrEqual(Math.min(2, tasks.length));
    
    // All container IDs should be valid (1-3)
    for (const containerId of containerAllocations) {
      expect(containerId).toBeGreaterThanOrEqual(1);
      expect(containerId).toBeLessThanOrEqual(3);
    }
  });

  test('should track stage transitions correctly', async ({ page }) => {
    test.skip(!db, 'Database not available');
    
    // Create a project and task
    const projectName = await helpers.createProject();
    const taskTitle = `Transition Test ${Date.now()}`;
    await helpers.createTask(taskTitle, 'Test stage transitions');
    
    // Navigate to orchestrator
    await helpers.navigateToOrchestrator();
    
    // Track stage transitions
    const stages = ['specification', 'implementation', 'review_qa', 'completed'];
    const observedTransitions: string[] = [];
    
    for (const expectedStage of stages) {
      await helpers.waitForTaskStage(taskTitle, expectedStage, 120000);
      
      const task = db.prepare('SELECT orchestrator_stage FROM tasks WHERE title = ?').get(taskTitle) as any;
      observedTransitions.push(task.orchestrator_stage);
      
      // Give some time for processing
      await page.waitForTimeout(5000);
    }
    
    // Verify transitions happened in order
    expect(observedTransitions).toEqual(stages);
    
    // Check final status
    const finalTask = db.prepare('SELECT status FROM tasks WHERE title = ?').get(taskTitle) as any;
    expect(finalTask.status).toBe('done');
  });
});