use std::sync::Arc;

use crate::domains::interventions::domain::models::intervention::Intervention;
use crate::domains::interventions::infrastructure::intervention::InterventionService;
use crate::domains::tasks::infrastructure::task::TaskService;
use crate::shared::contracts::auth::UserRole;
use crate::shared::ipc::errors::AppError;
use crate::shared::ipc::CommandContext;

#[derive(Debug)]
pub enum InterventionsCommand {
    Get { intervention_id: String },
    GetActiveByTask { task_id: String },
    GetLatestByTask { task_id: String },
    GetStep {
        intervention_id: String,
        step_id: String,
    },
}

pub enum InterventionsResponse {
    Intervention(Intervention),
    InterventionList(Vec<Intervention>),
    OptionalIntervention(Option<Intervention>),
    Step(crate::domains::interventions::domain::models::step::InterventionStep),
}

/// Facade for the Interventions bounded context.
///
/// Provides intervention lifecycle management — start, advance, finalize —
/// with input validation and error mapping.
#[derive(Debug)]
pub struct InterventionsFacade {
    intervention_service: Arc<InterventionService>,
}

impl InterventionsFacade {
    pub fn new(intervention_service: Arc<InterventionService>) -> Self {
        Self {
            intervention_service,
        }
    }

    pub fn is_ready(&self) -> bool {
        true
    }

    /// Access the underlying intervention service.
    pub fn intervention_service(&self) -> &Arc<InterventionService> {
        &self.intervention_service
    }

    /// Validate that an intervention ID is present.
    pub fn validate_intervention_id(&self, intervention_id: &str) -> Result<(), AppError> {
        if intervention_id.trim().is_empty() {
            return Err(AppError::Validation(
                "intervention_id is required".to_string(),
            ));
        }
        Ok(())
    }

    /// Validate that a task ID is present for intervention operations.
    pub fn validate_task_id(&self, task_id: &str) -> Result<(), AppError> {
        if task_id.trim().is_empty() {
            return Err(AppError::Validation(
                "task_id is required for intervention operations".to_string(),
            ));
        }
        Ok(())
    }

    /// Enforce that the current user may access the given intervention.
    ///
    /// Only the assigned technician, admins, and supervisors are allowed.
    pub fn check_intervention_access(
        &self,
        user_id: &str,
        role: &UserRole,
        intervention: &Intervention,
    ) -> Result<(), AppError> {
        if intervention.technician_id.as_deref() != Some(user_id)
            && !matches!(role, UserRole::Admin | UserRole::Supervisor)
        {
            return Err(AppError::Authorization(
                "Not authorized to view this intervention".to_string(),
            ));
        }
        Ok(())
    }

    /// Enforce that the current user may access interventions belonging to a task.
    ///
    /// The caller must pass the result of `task_service.check_task_assignment` as
    /// `is_assigned_to_task`. Admins and supervisors are always allowed through.
    pub fn check_task_intervention_access(
        &self,
        role: &UserRole,
        is_assigned_to_task: bool,
    ) -> Result<(), AppError> {
        if !is_assigned_to_task && !matches!(role, UserRole::Admin | UserRole::Supervisor) {
            return Err(AppError::Authorization(
                "Not authorized to view interventions for this task".to_string(),
            ));
        }
        Ok(())
    }

    pub fn execute(
        &self,
        command: InterventionsCommand,
        ctx: &CommandContext,
        task_service: &Arc<TaskService>,
    ) -> Result<InterventionsResponse, AppError> {
        match command {
            InterventionsCommand::Get { intervention_id } => {
                self.validate_intervention_id(&intervention_id)?;
                let intervention = self
                    .intervention_service
                    .get_intervention(&intervention_id)
                    .map_err(|_| AppError::Database("Failed to get intervention".to_string()))?
                    .ok_or_else(|| {
                        AppError::NotFound(format!("Intervention {} not found", intervention_id))
                    })?;

                self.check_intervention_access(&ctx.session.user_id, &ctx.session.role, &intervention)?;
                Ok(InterventionsResponse::Intervention(intervention))
            }
            InterventionsCommand::GetActiveByTask { task_id } => {
                self.validate_task_id(&task_id)?;
                let task_access = task_service
                    .check_task_assignment(&task_id, &ctx.session.user_id)
                    .unwrap_or(false);
                self.check_task_intervention_access(&ctx.session.role, task_access)?;

                let payload = match self.intervention_service.get_active_intervention_by_task(&task_id) {
                    Ok(Some(intervention)) => vec![intervention],
                    Ok(None) => vec![],
                    Err(_) => {
                        return Err(AppError::Database(
                            "Failed to get active interventions".to_string(),
                        ))
                    }
                };
                Ok(InterventionsResponse::InterventionList(payload))
            }
            InterventionsCommand::GetLatestByTask { task_id } => {
                self.validate_task_id(&task_id)?;
                let task_access = task_service
                    .check_task_assignment(&task_id, &ctx.session.user_id)
                    .unwrap_or(false);
                self.check_task_intervention_access(&ctx.session.role, task_access)?;
                let intervention = self
                    .intervention_service
                    .get_latest_intervention_by_task(&task_id)
                    .map_err(|_| AppError::Database("Failed to get latest intervention".to_string()))?;
                Ok(InterventionsResponse::OptionalIntervention(intervention))
            }
            InterventionsCommand::GetStep {
                intervention_id,
                step_id,
            } => {
                self.validate_intervention_id(&intervention_id)?;
                let intervention = self
                    .intervention_service
                    .get_intervention(&intervention_id)
                    .map_err(|_| AppError::Database("Failed to get intervention".to_string()))?
                    .ok_or_else(|| {
                        AppError::NotFound(format!("Intervention {} not found", intervention_id))
                    })?;
                self.check_intervention_access(&ctx.session.user_id, &ctx.session.role, &intervention)?;
                let step = self
                    .intervention_service
                    .get_step(&step_id)
                    .map_err(|_| AppError::Database("Failed to get intervention step".to_string()))?
                    .ok_or_else(|| AppError::NotFound(format!("Step {} not found", step_id)))?;
                Ok(InterventionsResponse::Step(step))
            }
        }
    }
}
