use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json,
    routing::{get, post},
    Router,
};
use db::models::{
    orchestrator::OrchestratorStageOutput,
    task::{OrchestratorStage, Task},
};
use serde::{Deserialize, Serialize};
use services::services::orchestrator::{OrchestratorService, OrchestratorStatus};
use sqlx::SqlitePool;
use uuid::Uuid;

use crate::{error::AppError, DeploymentImpl};

pub fn router(deployment: &DeploymentImpl) -> Router<DeploymentImpl> {
    Router::new()
        .route("/orchestrator/status", get(get_orchestrator_status))
        .route("/orchestrator/tasks", get(get_orchestrator_tasks))
        .route("/orchestrator/retry/:task_id", post(retry_task))
}

#[derive(Debug, Serialize)]
struct OrchestratorTaskResponse {
    pub id: Uuid,
    pub title: String,
    pub stage: Option<OrchestratorStage>,
    pub outputs: OrchestratorTaskOutputs,
}

#[derive(Debug, Serialize)]
struct OrchestratorTaskOutputs {
    pub specification: Option<String>,
    pub implementation: Option<String>,
    pub review: Option<String>,
}

async fn get_orchestrator_status(
    State(deployment): State<DeploymentImpl>,
) -> Result<Json<OrchestratorStatus>, AppError> {
    let orchestrator = OrchestratorService::new(deployment.pool.clone());
    let status = orchestrator.get_status().await?;
    Ok(Json(status))
}

async fn get_orchestrator_tasks(
    State(deployment): State<DeploymentImpl>,
) -> Result<Json<Vec<OrchestratorTaskResponse>>, AppError> {
    // Get all tasks with orchestrator stages
    let tasks: Vec<Task> = sqlx::query_as!(
        Task,
        r#"SELECT 
            id as "id!: Uuid",
            project_id as "project_id!: Uuid",
            title,
            description,
            status as "status!: db::models::task::TaskStatus",
            parent_task_attempt as "parent_task_attempt: Uuid",
            orchestrator_stage as "orchestrator_stage: OrchestratorStage",
            orchestrator_context,
            container_id,
            created_at as "created_at!",
            updated_at as "updated_at!"
        FROM tasks 
        WHERE orchestrator_stage IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 50"#
    )
    .fetch_all(&deployment.pool)
    .await?;
    
    // Get outputs for each task
    let mut response = Vec::new();
    
    for task in tasks {
        let outputs = OrchestratorStageOutput::find_by_task_id(&deployment.pool, task.id).await?;
        
        let spec_output = outputs
            .iter()
            .find(|o| o.stage == OrchestratorStage::Specification)
            .and_then(|o| o.output.clone());
            
        let impl_output = outputs
            .iter()
            .find(|o| o.stage == OrchestratorStage::Implementation)
            .and_then(|o| o.output.clone());
            
        let review_output = outputs
            .iter()
            .find(|o| o.stage == OrchestratorStage::ReviewQa)
            .and_then(|o| o.output.clone());
        
        response.push(OrchestratorTaskResponse {
            id: task.id,
            title: task.title,
            stage: task.orchestrator_stage,
            outputs: OrchestratorTaskOutputs {
                specification: spec_output,
                implementation: impl_output,
                review: review_output,
            },
        });
    }
    
    Ok(Json(response))
}

#[derive(Debug, Deserialize)]
struct RetryTaskRequest {
    pub from_stage: Option<OrchestratorStage>,
}

async fn retry_task(
    State(deployment): State<DeploymentImpl>,
    Path(task_id): Path<Uuid>,
    Json(request): Json<RetryTaskRequest>,
) -> Result<StatusCode, AppError> {
    let task = Task::find_by_id(&deployment.pool, task_id)
        .await?
        .ok_or_else(|| AppError::new("Task not found", StatusCode::NOT_FOUND))?;
    
    // Determine which stage to retry from
    let retry_stage = request.from_stage.unwrap_or_else(|| {
        task.orchestrator_stage.clone().unwrap_or(OrchestratorStage::Pending)
    });
    
    // Update task to retry from specified stage
    sqlx::query!(
        "UPDATE tasks SET orchestrator_stage = $1, status = 'todo', container_id = NULL WHERE id = $2",
        retry_stage as OrchestratorStage,
        task_id
    )
    .execute(&deployment.pool)
    .await?;
    
    // Clear outputs from this stage onward
    match retry_stage {
        OrchestratorStage::Pending | OrchestratorStage::Specification => {
            sqlx::query!(
                "DELETE FROM orchestrator_stage_outputs WHERE task_id = $1",
                task_id
            )
            .execute(&deployment.pool)
            .await?;
        }
        OrchestratorStage::Implementation => {
            sqlx::query!(
                "DELETE FROM orchestrator_stage_outputs WHERE task_id = $1 AND stage IN ('implementation', 'review_qa')",
                task_id
            )
            .execute(&deployment.pool)
            .await?;
        }
        OrchestratorStage::ReviewQa => {
            sqlx::query!(
                "DELETE FROM orchestrator_stage_outputs WHERE task_id = $1 AND stage = 'review_qa'",
                task_id
            )
            .execute(&deployment.pool)
            .await?;
        }
        _ => {}
    }
    
    Ok(StatusCode::OK)
}