use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, SqlitePool};
use ts_rs::TS;
use uuid::Uuid;

use super::task::OrchestratorStage;

#[derive(Debug, Clone, FromRow, Serialize, Deserialize, TS)]
pub struct OrchestratorStageOutput {
    pub id: Uuid,
    pub task_id: Uuid,
    pub stage: OrchestratorStage,
    pub command_used: Option<String>,
    pub output: Option<String>,
    pub success: bool,
    pub created_at: DateTime<Utc>,
}

impl OrchestratorStageOutput {
    pub async fn create(
        pool: &SqlitePool,
        task_id: Uuid,
        stage: OrchestratorStage,
        command_used: String,
        output: String,
        success: bool,
    ) -> Result<Self, sqlx::Error> {
        let id = Uuid::new_v4();
        let stage_str = match stage {
            OrchestratorStage::Pending => "pending",
            OrchestratorStage::Specification => "specification",
            OrchestratorStage::Implementation => "implementation",
            OrchestratorStage::ReviewQa => "review_qa",
            OrchestratorStage::Completed => "completed",
        };
        let success_int = if success { 1i64 } else { 0i64 };
        sqlx::query_as!(
            OrchestratorStageOutput,
            r#"INSERT INTO orchestrator_stage_outputs (id, task_id, stage, command_used, output, success) 
               VALUES ($1, $2, $3, $4, $5, $6) 
               ON CONFLICT(task_id, stage) DO UPDATE SET 
                   command_used = excluded.command_used,
                   output = excluded.output,
                   success = excluded.success,
                   created_at = datetime('now', 'subsec')
               RETURNING id as "id!: Uuid", task_id as "task_id!: Uuid", stage as "stage!: OrchestratorStage", command_used, output, success as "success!: bool", created_at as "created_at!: DateTime<Utc>""#,
            id,
            task_id,
            stage_str,
            command_used,
            output,
            success_int
        )
        .fetch_one(pool)
        .await
    }

    pub async fn find_by_task_and_stage(
        pool: &SqlitePool,
        task_id: Uuid,
        stage: OrchestratorStage,
    ) -> Result<Option<Self>, sqlx::Error> {
        let stage_str = match stage {
            OrchestratorStage::Pending => "pending",
            OrchestratorStage::Specification => "specification",
            OrchestratorStage::Implementation => "implementation",
            OrchestratorStage::ReviewQa => "review_qa",
            OrchestratorStage::Completed => "completed",
        };
        sqlx::query_as!(
            OrchestratorStageOutput,
            r#"SELECT id as "id!: Uuid", task_id as "task_id!: Uuid", stage as "stage!: OrchestratorStage", command_used, output, success as "success!: bool", created_at as "created_at!: DateTime<Utc>"
               FROM orchestrator_stage_outputs 
               WHERE task_id = $1 AND stage = $2"#,
            task_id,
            stage_str
        )
        .fetch_optional(pool)
        .await
    }

    pub async fn find_by_task_id(
        pool: &SqlitePool,
        task_id: Uuid,
    ) -> Result<Vec<Self>, sqlx::Error> {
        sqlx::query_as!(
            OrchestratorStageOutput,
            r#"SELECT id as "id!: Uuid", task_id as "task_id!: Uuid", stage as "stage!: OrchestratorStage", command_used, output, success as "success!: bool", created_at as "created_at!: DateTime<Utc>"
               FROM orchestrator_stage_outputs 
               WHERE task_id = $1
               ORDER BY created_at ASC"#,
            task_id
        )
        .fetch_all(pool)
        .await
    }
}