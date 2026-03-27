use crate::db::{Database, FromSqlRow, InterventionResult};
use crate::domains::interventions::domain::models::step::InterventionStep;
use crate::domains::interventions::infrastructure::intervention_sql::{
    step_upsert_params, StepDbFields, SELECT_STEP_FIELDS_SQL, STEP_UPSERT_SQL,
};
use rusqlite::{params, OptionalExtension, Transaction};
use std::sync::Arc;
use tracing::debug;

pub(super) fn get_step(
    db: &Arc<Database>,
    id: &str,
) -> InterventionResult<Option<InterventionStep>> {
    let conn = db.get_connection()?;
    let sql = format!("{SELECT_STEP_FIELDS_SQL} WHERE id = ?");
    let mut stmt = conn.prepare(&sql)?;
    stmt.query_row([id], InterventionStep::from_row)
        .optional()
        .map_err(Into::into)
}

pub(super) fn get_step_by_number(
    db: &Arc<Database>,
    intervention_id: &str,
    step_number: i32,
) -> InterventionResult<Option<InterventionStep>> {
    let conn = db.get_connection()?;
    let sql = format!("{SELECT_STEP_FIELDS_SQL} WHERE intervention_id = ? AND step_number = ?");
    let mut stmt = conn.prepare(&sql)?;
    stmt.query_row(
        params![intervention_id, step_number],
        InterventionStep::from_row,
    )
    .optional()
    .map_err(Into::into)
}

pub(super) fn get_intervention_steps(
    db: &Arc<Database>,
    intervention_id: &str,
) -> InterventionResult<Vec<InterventionStep>> {
    let conn = db.get_connection()?;
    let sql = format!("{SELECT_STEP_FIELDS_SQL} WHERE intervention_id = ? ORDER BY step_number");
    let mut stmt = conn.prepare(&sql)?;
    let steps = stmt
        .query_map([intervention_id], InterventionStep::from_row)?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(steps)
}

pub(super) fn save_step_with_tx(
    tx: &Transaction,
    step: &InterventionStep,
) -> InterventionResult<()> {
    let fields = StepDbFields::from_step(step);
    let params = step_upsert_params(step, &fields);
    let rows_affected = tx.execute(STEP_UPSERT_SQL, rusqlite::params_from_iter(params))?;

    debug!(
        step_id = %step.id,
        intervention_id = %step.intervention_id,
        step_number = step.step_number,
        rows_affected = rows_affected,
        "Saved intervention step (transaction)"
    );

    Ok(())
}

pub(super) fn save_steps_batch_with_tx(
    tx: &Transaction,
    steps: &[InterventionStep],
) -> InterventionResult<()> {
    if steps.is_empty() {
        return Ok(());
    }

    let mut stmt = tx.prepare_cached(STEP_UPSERT_SQL)?;
    for step in steps {
        let fields = StepDbFields::from_step(step);
        let params = step_upsert_params(step, &fields);
        stmt.execute(rusqlite::params_from_iter(params))?;
    }

    debug!(
        count = steps.len(),
        "Saved intervention steps batch (transaction)"
    );
    Ok(())
}

pub(super) fn save_step(db: &Arc<Database>, step: &InterventionStep) -> InterventionResult<()> {
    let conn = db.get_connection()?;
    let fields = StepDbFields::from_step(step);
    let params = step_upsert_params(step, &fields);
    let rows_affected = conn.execute(STEP_UPSERT_SQL, rusqlite::params_from_iter(params))?;

    debug!(
        step_id = %step.id,
        intervention_id = %step.intervention_id,
        step_number = step.step_number,
        rows_affected = rows_affected,
        "Saved intervention step"
    );

    Ok(())
}
