use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;

use command_group::AsyncGroupChild;
use db::models::{
    orchestrator::OrchestratorStageOutput,
    task::{OrchestratorStage, Task, TaskStatus},
    task_attempt::{CreateTaskAttempt, TaskAttempt},
    execution_process::{ExecutionProcess, CreateExecutionProcess, ExecutorType, RunReason},
};
use executors::{
    actions::{coding_agent_initial::CodingAgentInitialRequest, Executable},
    executors::claude::ClaudeCode,
    command::CommandBuilder,
    profile::ProfileVariantLabel,
};
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use tokio::sync::Mutex;
use tokio::io::AsyncReadExt;
use tracing::{debug, error, info, warn};
use uuid::Uuid;

#[derive(Debug, Clone)]
pub struct Container {
    pub id: i32,
    pub port: u16,
    pub worktree: String,
}

#[derive(Debug)]
pub struct ContainerPool {
    containers: Vec<Container>,
    allocated: Arc<Mutex<HashMap<Uuid, i32>>>,
}

impl ContainerPool {
    pub fn new() -> Self {
        Self {
            containers: vec![
                Container {
                    id: 1,
                    port: 8081,
                    worktree: "/worktrees/task-1".to_string(),
                },
                Container {
                    id: 2,
                    port: 8082,
                    worktree: "/worktrees/task-2".to_string(),
                },
                Container {
                    id: 3,
                    port: 8083,
                    worktree: "/worktrees/task-3".to_string(),
                },
            ],
            allocated: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub async fn allocate(&self, task_id: Uuid) -> Option<Container> {
        let mut allocated = self.allocated.lock().await;
        
        // Check if task already has a container
        if let Some(&container_id) = allocated.get(&task_id) {
            return self.containers.iter().find(|c| c.id == container_id).cloned();
        }

        // Find free container
        for container in &self.containers {
            if !allocated.values().any(|&id| id == container.id) {
                allocated.insert(task_id, container.id);
                return Some(container.clone());
            }
        }

        None
    }

    pub async fn release(&self, task_id: Uuid) {
        let mut allocated = self.allocated.lock().await;
        allocated.remove(&task_id);
    }

    pub async fn get_allocated_container(&self, task_id: Uuid) -> Option<Container> {
        let allocated = self.allocated.lock().await;
        if let Some(&container_id) = allocated.get(&task_id) {
            return self.containers.iter().find(|c| c.id == container_id).cloned();
        }
        None
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClaudeCommand {
    pub base: String,
    pub args: Vec<String>,
    pub prompt: String,
    pub context: Option<String>,
}

pub struct OrchestratorService {
    db_pool: SqlitePool,
    container_pool: Arc<ContainerPool>,
    max_concurrent: usize,
}

impl OrchestratorService {
    pub fn new(db_pool: SqlitePool) -> Self {
        Self {
            db_pool,
            container_pool: Arc::new(ContainerPool::new()),
            max_concurrent: 2,
        }
    }

    pub async fn run_loop(&self) {
        info!("Starting orchestrator service loop");
        
        loop {
            match self.process_pending_tasks().await {
                Ok(()) => {}
                Err(e) => error!("Error processing tasks: {:?}", e),
            }
            
            tokio::time::sleep(Duration::from_secs(30)).await;
        }
    }

    async fn process_pending_tasks(&self) -> Result<(), sqlx::Error> {
        // Get tasks that need processing
        let tasks = self.get_next_tasks().await?;
        
        for task in tasks {
            let db_pool = self.db_pool.clone();
            let container_pool = self.container_pool.clone();
            
            tokio::spawn(async move {
                if let Err(e) = Self::process_task(db_pool, container_pool, task).await {
                    error!("Error processing task: {:?}", e);
                }
            });
        }
        
        Ok(())
    }

    async fn get_next_tasks(&self) -> Result<Vec<Task>, sqlx::Error> {
        // Get todo tasks that haven't started orchestration yet
        let tasks: Vec<Task> = sqlx::query_as!(
            Task,
            r#"SELECT 
                id as "id!: Uuid",
                project_id as "project_id!: Uuid",
                title,
                description,
                status as "status!: TaskStatus",
                parent_task_attempt as "parent_task_attempt: Uuid",
                orchestrator_stage as "orchestrator_stage: OrchestratorStage",
                orchestrator_context,
                container_id,
                created_at as "created_at!",
                updated_at as "updated_at!"
            FROM tasks 
            WHERE status = 'todo' 
              AND (orchestrator_stage IS NULL OR orchestrator_stage = 'pending')
              AND container_id IS NULL
            ORDER BY created_at ASC
            LIMIT $1"#,
            self.max_concurrent as i64
        )
        .fetch_all(&self.db_pool)
        .await?;
        
        Ok(tasks)
    }

    async fn process_task(
        db_pool: SqlitePool,
        container_pool: Arc<ContainerPool>,
        mut task: Task,
    ) -> Result<(), Box<dyn std::error::Error>> {
        info!("Processing task {} - {}", task.id, task.title);
        
        // Allocate container
        let container = match container_pool.allocate(task.id).await {
            Some(c) => c,
            None => {
                warn!("No containers available for task {}", task.id);
                return Ok(());
            }
        };
        
        // Update task with container assignment
        sqlx::query!(
            "UPDATE tasks SET container_id = $1 WHERE id = $2",
            container.id,
            task.id
        )
        .execute(&db_pool)
        .await?;
        
        // Get current stage
        let current_stage = task.orchestrator_stage.clone().unwrap_or(OrchestratorStage::Pending);
        
        // Process based on stage
        match current_stage {
            OrchestratorStage::Pending => {
                Self::transition_to_specification(&db_pool, &task).await?;
            }
            OrchestratorStage::Specification => {
                Self::execute_specification(&db_pool, &task, &container).await?;
                Self::transition_to_implementation(&db_pool, &task).await?;
            }
            OrchestratorStage::Implementation => {
                Self::execute_implementation(&db_pool, &task, &container).await?;
                Self::transition_to_review(&db_pool, &task).await?;
            }
            OrchestratorStage::ReviewQa => {
                Self::execute_review(&db_pool, &task, &container).await?;
                Self::transition_to_completed(&db_pool, &task).await?;
            }
            OrchestratorStage::Completed => {
                info!("Task {} already completed", task.id);
            }
        }
        
        // Release container when done
        if matches!(current_stage, OrchestratorStage::Completed) {
            container_pool.release(task.id).await;
            sqlx::query!(
                "UPDATE tasks SET container_id = NULL WHERE id = $1",
                task.id
            )
            .execute(&db_pool)
            .await?;
        }
        
        Ok(())
    }

    async fn transition_to_specification(
        db_pool: &SqlitePool,
        task: &Task,
    ) -> Result<(), sqlx::Error> {
        info!("Transitioning task {} to specification stage", task.id);
        
        sqlx::query!(
            "UPDATE tasks SET orchestrator_stage = 'specification', status = 'inprogress' WHERE id = $1",
            task.id
        )
        .execute(db_pool)
        .await?;
        
        Ok(())
    }

    async fn execute_specification(
        db_pool: &SqlitePool,
        task: &Task,
        container: &Container,
    ) -> Result<(), Box<dyn std::error::Error>> {
        info!("Executing specification for task {}", task.id);
        
        // Create task attempt for this stage
        let attempt = TaskAttempt::create(
            db_pool,
            &CreateTaskAttempt {
                task_id: task.id,
                container_ref: Some(container.worktree.clone()),
                executor: Some("claude-code".to_string()),
                profile: "claude-code".to_string(),
                base_branch: None,
                branch: None,
                merge_commit: None,
            },
        )
        .await?;
        
        // Create the Claude executor with /create-spec command
        let command_builder = CommandBuilder::new("npx".to_string())
            .add_args(vec![
                "-y".to_string(),
                "@anthropic-ai/claude-code@latest".to_string(),
                "--command".to_string(),
                "/create-spec".to_string(),
            ]);
        
        let claude = ClaudeCode {
            command: command_builder,
            plan: false,
        };
        
        // Get working directory
        let working_dir = PathBuf::from(&container.worktree);
        
        // Spawn the process
        let prompt = task.description.clone().unwrap_or(task.title.clone());
        let mut child = claude.spawn(&working_dir, &prompt).await?;
        
        // Collect output
        let mut stdout = String::new();
        if let Some(mut stdout_handle) = child.inner().stdout.take() {
            stdout_handle.read_to_string(&mut stdout).await?;
        }
        
        // Wait for process to complete
        let status = child.wait().await?;
        let success = status.success();
        
        // Store output
        OrchestratorStageOutput::create(
            db_pool,
            task.id,
            OrchestratorStage::Specification,
            "npx -y @anthropic-ai/claude-code@latest --command /create-spec".to_string(),
            stdout.clone(),
            success,
        )
        .await?;
        
        // Store output in context
        let context = serde_json::json!({
            "specification": stdout
        });
        
        sqlx::query!(
            "UPDATE tasks SET orchestrator_context = $1 WHERE id = $2",
            context.to_string(),
            task.id
        )
        .execute(db_pool)
        .await?;
        
        Ok(())
    }

    async fn transition_to_implementation(
        db_pool: &SqlitePool,
        task: &Task,
    ) -> Result<(), sqlx::Error> {
        info!("Transitioning task {} to implementation stage", task.id);
        
        sqlx::query!(
            "UPDATE tasks SET orchestrator_stage = 'implementation' WHERE id = $1",
            task.id
        )
        .execute(db_pool)
        .await?;
        
        Ok(())
    }

    async fn execute_implementation(
        db_pool: &SqlitePool,
        task: &Task,
        container: &Container,
    ) -> Result<(), Box<dyn std::error::Error>> {
        info!("Executing implementation for task {}", task.id);
        
        // Get specification from previous stage
        let spec_output = OrchestratorStageOutput::find_by_task_and_stage(
            db_pool,
            task.id,
            OrchestratorStage::Specification,
        )
        .await?;
        
        let spec_context = spec_output
            .and_then(|s| s.output)
            .unwrap_or_default();
        
        // Create task attempt
        let attempt = TaskAttempt::create(
            db_pool,
            &CreateTaskAttempt {
                task_id: task.id,
                container_ref: Some(container.worktree.clone()),
                executor: Some("claude-code".to_string()),
                profile: "claude-code".to_string(),
                base_branch: None,
                branch: None,
                merge_commit: None,
            },
        )
        .await?;
        
        // Create the Claude executor
        let command_builder = CommandBuilder::new("npx".to_string())
            .add_args(vec![
                "-y".to_string(),
                "@anthropic-ai/claude-code@latest".to_string(),
            ]);
        
        let claude = ClaudeCode {
            command: command_builder,
            plan: false,
        };
        
        // Prepare prompt with spec context
        let prompt = format!(
            "Based on this specification:\n\n{}\n\nImplement the solution.",
            spec_context
        );
        
        // Get working directory
        let working_dir = PathBuf::from(&container.worktree);
        
        // Spawn the process
        let mut child = claude.spawn(&working_dir, &prompt).await?;
        
        // Collect output
        let mut stdout = String::new();
        if let Some(mut stdout_handle) = child.inner().stdout.take() {
            stdout_handle.read_to_string(&mut stdout).await?;
        }
        
        // Wait for process to complete
        let status = child.wait().await?;
        let success = status.success();
        
        // Store output
        OrchestratorStageOutput::create(
            db_pool,
            task.id,
            OrchestratorStage::Implementation,
            "npx -y @anthropic-ai/claude-code@latest".to_string(),
            stdout.clone(),
            success,
        )
        .await?;
        
        // Update context
        let mut context_json: serde_json::Value = task.orchestrator_context
            .as_ref()
            .and_then(|c| serde_json::from_str(c).ok())
            .unwrap_or_else(|| serde_json::json!({}));
        
        context_json["implementation"] = serde_json::json!(stdout);
        
        sqlx::query!(
            "UPDATE tasks SET orchestrator_context = $1 WHERE id = $2",
            context_json.to_string(),
            task.id
        )
        .execute(db_pool)
        .await?;
        
        Ok(())
    }

    async fn transition_to_review(
        db_pool: &SqlitePool,
        task: &Task,
    ) -> Result<(), sqlx::Error> {
        info!("Transitioning task {} to review stage", task.id);
        
        sqlx::query!(
            "UPDATE tasks SET orchestrator_stage = 'review_qa' WHERE id = $1",
            task.id
        )
        .execute(db_pool)
        .await?;
        
        Ok(())
    }

    async fn execute_review(
        db_pool: &SqlitePool,
        task: &Task,
        container: &Container,
    ) -> Result<(), Box<dyn std::error::Error>> {
        info!("Executing review for task {}", task.id);
        
        // Get implementation output
        let impl_output = OrchestratorStageOutput::find_by_task_and_stage(
            db_pool,
            task.id,
            OrchestratorStage::Implementation,
        )
        .await?;
        
        let impl_context = impl_output
            .and_then(|s| s.output)
            .unwrap_or_default();
        
        // Create task attempt
        let attempt = TaskAttempt::create(
            db_pool,
            &CreateTaskAttempt {
                task_id: task.id,
                container_ref: Some(container.worktree.clone()),
                executor: Some("claude-code".to_string()),
                profile: "claude-code".to_string(),
                base_branch: None,
                branch: None,
                merge_commit: None,
            },
        )
        .await?;
        
        // Create the Claude executor with review command
        let command_builder = CommandBuilder::new("npx".to_string())
            .add_args(vec![
                "-y".to_string(),
                "@anthropic-ai/claude-code@latest".to_string(),
                "--command".to_string(),
                "/review".to_string(),
                "--with-tests".to_string(),
            ]);
        
        let claude = ClaudeCode {
            command: command_builder,
            plan: false,
        };
        
        // Prepare review prompt
        let prompt = format!(
            "Review the implementation and add tests to ensure it works correctly."
        );
        
        // Get working directory
        let working_dir = PathBuf::from(&container.worktree);
        
        // Spawn the process
        let mut child = claude.spawn(&working_dir, &prompt).await?;
        
        // Collect output
        let mut stdout = String::new();
        if let Some(mut stdout_handle) = child.inner().stdout.take() {
            stdout_handle.read_to_string(&mut stdout).await?;
        }
        
        // Wait for process to complete
        let status = child.wait().await?;
        let success = status.success();
        
        // Store output
        OrchestratorStageOutput::create(
            db_pool,
            task.id,
            OrchestratorStage::ReviewQa,
            "npx -y @anthropic-ai/claude-code@latest --command /review --with-tests".to_string(),
            stdout,
            success,
        )
        .await?;
        
        Ok(())
    }

    async fn transition_to_completed(
        db_pool: &SqlitePool,
        task: &Task,
    ) -> Result<(), sqlx::Error> {
        info!("Transitioning task {} to completed", task.id);
        
        sqlx::query!(
            "UPDATE tasks SET orchestrator_stage = 'completed', status = 'done' WHERE id = $1",
            task.id
        )
        .execute(db_pool)
        .await?;
        
        Ok(())
    }

    pub async fn get_status(&self) -> Result<OrchestratorStatus, sqlx::Error> {
        let active_tasks: Vec<ActiveTask> = sqlx::query_as!(
            ActiveTask,
            r#"SELECT 
                id as "task_id!: Uuid",
                title as "task_title!",
                orchestrator_stage as "stage!: OrchestratorStage",
                container_id as "container_id!",
                updated_at as "started_at!"
            FROM tasks 
            WHERE container_id IS NOT NULL
              AND orchestrator_stage != 'completed'"#
        )
        .fetch_all(&self.db_pool)
        .await?;
        
        let queued_tasks: Vec<QueuedTask> = sqlx::query_as!(
            QueuedTask,
            r#"SELECT 
                id as "task_id!: Uuid",
                title as "task_title!",
                created_at
            FROM tasks 
            WHERE status = 'todo' 
              AND (orchestrator_stage IS NULL OR orchestrator_stage = 'pending')
              AND container_id IS NULL
            ORDER BY created_at ASC"#
        )
        .fetch_all(&self.db_pool)
        .await?;
        
        let containers = vec![
            ContainerStatus {
                id: 1,
                allocated_to: active_tasks.iter().find(|t| t.container_id == 1).map(|t| t.task_id),
                status: if active_tasks.iter().any(|t| t.container_id == 1) {
                    "busy".to_string()
                } else {
                    "available".to_string()
                },
            },
            ContainerStatus {
                id: 2,
                allocated_to: active_tasks.iter().find(|t| t.container_id == 2).map(|t| t.task_id),
                status: if active_tasks.iter().any(|t| t.container_id == 2) {
                    "busy".to_string()
                } else {
                    "available".to_string()
                },
            },
            ContainerStatus {
                id: 3,
                allocated_to: active_tasks.iter().find(|t| t.container_id == 3).map(|t| t.task_id),
                status: if active_tasks.iter().any(|t| t.container_id == 3) {
                    "busy".to_string()
                } else {
                    "available".to_string()
                },
            },
        ];
        
        Ok(OrchestratorStatus {
            active_tasks,
            queued_tasks,
            containers,
        })
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OrchestratorStatus {
    pub active_tasks: Vec<ActiveTask>,
    pub queued_tasks: Vec<QueuedTask>,
    pub containers: Vec<ContainerStatus>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct ActiveTask {
    pub task_id: Uuid,
    pub task_title: String,
    pub stage: OrchestratorStage,
    pub container_id: i32,
    pub started_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct QueuedTask {
    pub task_id: Uuid,
    pub task_title: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ContainerStatus {
    pub id: i32,
    pub allocated_to: Option<Uuid>,
    pub status: String,
}