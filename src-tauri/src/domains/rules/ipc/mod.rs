use crate::commands::{AppResult, AppState};
use crate::domains::rules::domain::models::rules::{
    CreateRuleDefinitionRequest, RuleDefinition, RuleEvaluationResult, TestRuleRequest,
    UpdateRuleDefinitionRequest,
};
use crate::resolve_context;
use crate::shared::contracts::auth::UserRole;

#[tauri::command]
pub async fn list_rules(
    state: AppState<'_>,
    correlation_id: Option<String>,
) -> AppResult<Vec<RuleDefinition>> {
    let ctx = resolve_context!(&state, &correlation_id, UserRole::Admin);
    state.rules_service.list(&ctx).await
}

#[tauri::command]
pub async fn get_rules(
    id: String,
    state: AppState<'_>,
    correlation_id: Option<String>,
) -> AppResult<RuleDefinition> {
    let ctx = resolve_context!(&state, &correlation_id, UserRole::Admin);
    state.rules_service.get(&id, &ctx).await
}

#[tauri::command]
pub async fn create_rule(
    request: CreateRuleDefinitionRequest,
    state: AppState<'_>,
    correlation_id: Option<String>,
) -> AppResult<RuleDefinition> {
    let ctx = resolve_context!(&state, &correlation_id, UserRole::Admin);
    state.rules_service.create(&ctx, request).await
}

#[tauri::command]
pub async fn update_rule(
    id: String,
    request: UpdateRuleDefinitionRequest,
    state: AppState<'_>,
    correlation_id: Option<String>,
) -> AppResult<RuleDefinition> {
    let ctx = resolve_context!(&state, &correlation_id, UserRole::Admin);
    state.rules_service.update(&ctx, &id, request).await
}

#[tauri::command]
pub async fn activate_rule(
    id: String,
    state: AppState<'_>,
    correlation_id: Option<String>,
) -> AppResult<RuleDefinition> {
    let ctx = resolve_context!(&state, &correlation_id, UserRole::Admin);
    state.rules_service.activate(&ctx, &id).await
}

#[tauri::command]
pub async fn disable_rule(
    id: String,
    state: AppState<'_>,
    correlation_id: Option<String>,
) -> AppResult<RuleDefinition> {
    let ctx = resolve_context!(&state, &correlation_id, UserRole::Admin);
    state.rules_service.disable(&ctx, &id).await
}

#[tauri::command]
pub async fn delete_rule(
    id: String,
    state: AppState<'_>,
    correlation_id: Option<String>,
) -> AppResult<RuleDefinition> {
    let ctx = resolve_context!(&state, &correlation_id, UserRole::Admin);
    state.rules_service.delete(&ctx, &id).await
}

#[tauri::command]
pub async fn test_rule(
    request: TestRuleRequest,
    state: AppState<'_>,
    correlation_id: Option<String>,
) -> AppResult<RuleEvaluationResult> {
    let ctx = resolve_context!(&state, &correlation_id, UserRole::Admin);
    state.rules_service.test(&ctx, request).await
}
