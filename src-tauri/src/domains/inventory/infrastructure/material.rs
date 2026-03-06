//! Material Service — coordinator for PPF material inventory and consumption management.
//!
//! This file contains:
//! - Error types and request DTOs
//! - `MaterialService` as the central coordinator that delegates to focused sub-repositories
//! - Material CRUD operations
//! - Atomic write operations (stock update, consumption recording, transaction creation)
//!   that must span multiple tables in a single DB transaction
//! - Read-only stats and low-stock / expired queries

use crate::db::Database;
use crate::domains::inventory::domain::material::{
    effective_threshold, DEFAULT_LOW_STOCK_THRESHOLD,
};
use crate::domains::inventory::domain::models::material::{
    InterventionMaterialSummary, InventoryMovementSummary, InventoryStats, InventoryTransaction,
    InventoryTransactionType, LowStockMaterial, LowStockMaterialsResponse, Material,
    MaterialCategory, MaterialConsumption, MaterialConsumptionSummary, MaterialStats, MaterialType,
    Supplier, UnitOfMeasure,
};
use rusqlite::params;
use std::collections::HashMap;
use uuid::Uuid;

use super::inventory_transaction_service::InventoryTransactionService;
use super::material_category_repository::MaterialCategoryRepository;
use super::material_consumption_repository::MaterialConsumptionRepository;
use super::supplier_repository::SupplierRepository;

// ── Error types ───────────────────────────────────────────────────────────────

/// Service errors for material operations.
#[derive(Debug, thiserror::Error)]
pub enum MaterialError {
    #[error("Database error: {0}")]
    Database(String),
    #[error("Not found: {0}")]
    NotFound(String),
    #[error("Validation error: {0}")]
    Validation(String),
    #[error("Authorization error: {0}")]
    Authorization(String),
    #[error("Insufficient stock: {0}")]
    InsufficientStock(String),
    #[error("Expired material: {0}")]
    ExpiredMaterial(String),
}

impl From<String> for MaterialError {
    fn from(s: String) -> Self {
        Self::Database(s)
    }
}

impl From<rusqlite::Error> for MaterialError {
    fn from(e: rusqlite::Error) -> Self {
        Self::Database(e.to_string())
    }
}

/// Result type for material operations.
pub type MaterialResult<T> = Result<T, MaterialError>;

// ── Request DTOs ──────────────────────────────────────────────────────────────

/// Request to create a new material.
#[derive(Debug, serde::Deserialize)]
pub struct CreateMaterialRequest {
    pub sku: String,
    pub name: String,
    pub description: Option<String>,
    pub material_type: MaterialType,
    pub category: Option<String>,
    pub subcategory: Option<String>,
    pub category_id: Option<String>,
    pub brand: Option<String>,
    pub model: Option<String>,
    pub specifications: Option<serde_json::Value>,
    pub unit_of_measure: UnitOfMeasure,
    pub minimum_stock: Option<f64>,
    pub maximum_stock: Option<f64>,
    pub reorder_point: Option<f64>,
    pub unit_cost: Option<f64>,
    pub currency: Option<String>,
    pub supplier_id: Option<String>,
    pub supplier_name: Option<String>,
    pub supplier_sku: Option<String>,
    pub quality_grade: Option<String>,
    pub certification: Option<String>,
    pub expiry_date: Option<i64>,
    pub batch_number: Option<String>,
    pub storage_location: Option<String>,
    pub warehouse_id: Option<String>,
}

/// Request to update material stock.
#[derive(Debug, serde::Deserialize)]
pub struct UpdateStockRequest {
    pub material_id: String,
    pub quantity_change: f64,
    pub reason: String,
    pub recorded_by: Option<String>,
}

/// Request to record material consumption.
#[derive(Debug, serde::Deserialize)]
pub struct RecordConsumptionRequest {
    pub intervention_id: String,
    pub material_id: String,
    pub step_id: Option<String>,
    pub step_number: Option<i32>,
    pub quantity_used: f64,
    pub waste_quantity: Option<f64>,
    pub waste_reason: Option<String>,
    pub batch_used: Option<String>,
    pub quality_notes: Option<String>,
    pub recorded_by: Option<String>,
}

/// Request to create a material category.
#[derive(Debug, serde::Deserialize)]
pub struct CreateMaterialCategoryRequest {
    pub name: String,
    pub code: Option<String>,
    pub parent_id: Option<String>,
    pub level: Option<i32>,
    pub description: Option<String>,
    pub color: Option<String>,
}

/// Request to create a supplier.
#[derive(Debug, serde::Deserialize)]
pub struct CreateSupplierRequest {
    pub name: String,
    pub code: Option<String>,
    pub contact_person: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub website: Option<String>,
    pub address_street: Option<String>,
    pub address_city: Option<String>,
    pub address_state: Option<String>,
    pub address_zip: Option<String>,
    pub address_country: Option<String>,
    pub tax_id: Option<String>,
    pub business_license: Option<String>,
    pub payment_terms: Option<String>,
    pub lead_time_days: Option<i32>,
    pub is_preferred: Option<bool>,
    pub quality_rating: Option<f64>,
    pub delivery_rating: Option<f64>,
    pub on_time_delivery_rate: Option<f64>,
    pub notes: Option<String>,
    pub special_instructions: Option<String>,
}

/// Request to create an inventory transaction.
#[derive(Debug, serde::Deserialize)]
pub struct CreateInventoryTransactionRequest {
    pub material_id: String,
    pub transaction_type: InventoryTransactionType,
    pub quantity: f64,
    pub reference_number: Option<String>,
    pub reference_type: Option<String>,
    pub notes: Option<String>,
    pub unit_cost: Option<f64>,
    pub warehouse_id: Option<String>,
    pub location_from: Option<String>,
    pub location_to: Option<String>,
    pub batch_number: Option<String>,
    pub expiry_date: Option<i64>,
    pub quality_status: Option<String>,
    pub intervention_id: Option<String>,
    pub step_id: Option<String>,
}

// ── MaterialService ───────────────────────────────────────────────────────────

/// Central coordinator for material inventory operations.
///
/// Delegates read operations to focused sub-repositories and retains the
/// atomic write operations that must span multiple tables in one transaction.
#[derive(Debug)]
pub struct MaterialService {
    db: Database,
    categories: MaterialCategoryRepository,
    suppliers: SupplierRepository,
    consumption: MaterialConsumptionRepository,
    transactions: InventoryTransactionService,
}

impl MaterialService {
    pub fn new(db: Database) -> Self {
        Self {
            categories: MaterialCategoryRepository::new(db.clone()),
            suppliers: SupplierRepository::new(db.clone()),
            consumption: MaterialConsumptionRepository::new(db.clone()),
            transactions: InventoryTransactionService::new(db.clone()),
            db,
        }
    }

    // ── Material CRUD ─────────────────────────────────────────────────────────

    /// Create a new material.
    pub fn create_material(
        &self,
        request: CreateMaterialRequest,
        created_by: Option<String>,
    ) -> MaterialResult<Material> {
        let created_by = created_by
            .filter(|user_id| !user_id.trim().is_empty())
            .ok_or_else(|| {
                MaterialError::Authorization("User ID is required to create materials".to_string())
            })?;
        self.validate_create_request(&request)?;

        let id = Uuid::new_v4().to_string();
        let mut material =
            Material::new(id.clone(), request.sku, request.name, request.material_type);

        material.description = request.description;
        material.category = request.category;
        material.subcategory = request.subcategory;
        material.category_id = request.category_id;
        material.brand = request.brand;
        material.model = request.model;
        material.specifications = request.specifications;
        material.unit_of_measure = request.unit_of_measure;
        material.minimum_stock = request.minimum_stock;
        material.maximum_stock = request.maximum_stock;
        material.reorder_point = request.reorder_point;
        material.unit_cost = request.unit_cost;
        material.currency = request.currency.unwrap_or_else(|| "EUR".to_string());
        material.supplier_id = request.supplier_id;
        material.supplier_name = request.supplier_name;
        material.supplier_sku = request.supplier_sku;
        material.quality_grade = request.quality_grade;
        material.certification = request.certification;
        material.expiry_date = request.expiry_date;
        material.batch_number = request.batch_number;
        material.storage_location = request.storage_location;
        material.warehouse_id = request.warehouse_id;
        material.created_by = Some(created_by.clone());
        material.updated_by = Some(created_by);

        self.save_material(&material)?;
        Ok(material)
    }

    /// Get material by ID.
    pub fn get_material(&self, id: &str) -> MaterialResult<Option<Material>> {
        Ok(self
            .db
            .query_single_as::<Material>("SELECT * FROM materials WHERE id = ?", params![id])?)
    }

    /// Get material by ID, returning an error if not found.
    pub fn get_material_by_id(&self, id: &str) -> MaterialResult<Material> {
        self.get_material(id)?
            .ok_or_else(|| MaterialError::NotFound(format!("Material {} not found", id)))
    }

    /// Batch-fetch multiple materials by ID in a single query.
    pub fn get_materials_by_ids(&self, ids: &[&str]) -> MaterialResult<HashMap<String, Material>> {
        if ids.is_empty() {
            return Ok(HashMap::new());
        }

        let placeholders: Vec<&str> = ids.iter().map(|_| "?").collect();
        let sql = format!(
            "SELECT * FROM materials WHERE id IN ({})",
            placeholders.join(", ")
        );

        let params: Vec<Box<dyn rusqlite::types::ToSql>> = ids
            .iter()
            .map(|id| Box::new(id.to_string()) as Box<dyn rusqlite::types::ToSql>)
            .collect();

        let materials: Vec<Material> = self
            .db
            .query_as(&sql, rusqlite::params_from_iter(params.iter()))?;

        let map = materials.into_iter().map(|m| (m.id.clone(), m)).collect();
        Ok(map)
    }

    /// Get material by SKU.
    pub fn get_material_by_sku(&self, sku: &str) -> MaterialResult<Option<Material>> {
        Ok(self
            .db
            .query_single_as::<Material>("SELECT * FROM materials WHERE sku = ?", params![sku])?)
    }

    /// List materials with optional type/category filters and pagination.
    pub fn list_materials(
        &self,
        material_type: Option<MaterialType>,
        category: Option<String>,
        active_only: bool,
        limit: Option<i32>,
        offset: Option<i32>,
    ) -> MaterialResult<Vec<Material>> {
        let mut conditions = Vec::new();
        let mut params_vec = Vec::new();

        if let Some(mt) = material_type {
            conditions.push("material_type = ?");
            params_vec.push(mt.to_string());
        }

        if let Some(cat) = category {
            conditions.push("category = ?");
            params_vec.push(cat);
        }

        if active_only {
            conditions.push("is_active = 1");
        }

        let where_clause = if conditions.is_empty() {
            String::new()
        } else {
            format!("WHERE {}", conditions.join(" AND "))
        };

        let limit_clause = limit.map(|l| format!("LIMIT {}", l)).unwrap_or_default();
        let offset_clause = offset.map(|o| format!("OFFSET {}", o)).unwrap_or_default();

        let sql = format!(
            "SELECT * FROM materials {} ORDER BY name ASC {} {}",
            where_clause, limit_clause, offset_clause
        );

        let params: Vec<&dyn rusqlite::ToSql> = params_vec
            .iter()
            .map(|s| s as &dyn rusqlite::ToSql)
            .collect();

        Ok(self.db.query_as::<Material>(&sql, &params[..])?)
    }

    /// Update an existing material.
    pub fn update_material(
        &self,
        id: &str,
        updates: CreateMaterialRequest,
        updated_by: Option<String>,
    ) -> MaterialResult<Material> {
        let updated_by = updated_by
            .filter(|user_id| !user_id.trim().is_empty())
            .ok_or_else(|| {
                MaterialError::Authorization("User ID is required to update materials".to_string())
            })?;
        let mut material = self
            .get_material(id)?
            .ok_or_else(|| MaterialError::NotFound(format!("Material {} not found", id)))?;
        self.validate_update_request(id, &updates)?;

        if !material.is_active || material.is_discontinued {
            return Err(MaterialError::Validation(
                "Cannot update inactive or discontinued materials".to_string(),
            ));
        }

        if let Some(max_stock) = updates.maximum_stock {
            if material.current_stock > max_stock {
                return Err(MaterialError::Validation(format!(
                    "Current stock {} exceeds new maximum stock limit of {}",
                    material.current_stock, max_stock
                )));
            }
        }

        material.sku = updates.sku;
        material.name = updates.name;
        material.description = updates.description;
        material.material_type = updates.material_type;
        material.category = updates.category;
        material.subcategory = updates.subcategory;
        material.brand = updates.brand;
        material.model = updates.model;
        material.specifications = updates.specifications;
        material.unit_of_measure = updates.unit_of_measure;
        material.minimum_stock = updates.minimum_stock;
        material.maximum_stock = updates.maximum_stock;
        material.reorder_point = updates.reorder_point;
        material.unit_cost = updates.unit_cost;
        if let Some(currency) = updates.currency {
            material.currency = currency;
        }
        material.supplier_id = updates.supplier_id;
        material.supplier_name = updates.supplier_name;
        material.supplier_sku = updates.supplier_sku;
        material.quality_grade = updates.quality_grade;
        material.certification = updates.certification;
        material.expiry_date = updates.expiry_date;
        material.batch_number = updates.batch_number;
        material.storage_location = updates.storage_location;
        material.warehouse_id = updates.warehouse_id;
        material.updated_by = Some(updated_by);
        material.updated_at = crate::shared::contracts::common::now();

        self.save_material(&material)?;
        Ok(material)
    }

    /// Soft-delete a material (marks it inactive and discontinued).
    pub fn delete_material(&self, id: &str, deleted_by: Option<String>) -> MaterialResult<()> {
        let deleted_by = deleted_by
            .filter(|user_id| !user_id.trim().is_empty())
            .ok_or_else(|| {
                MaterialError::Authorization("User ID is required to delete materials".to_string())
            })?;
        let material = self
            .get_material(id)?
            .ok_or_else(|| MaterialError::NotFound(format!("Material {} not found", id)))?;

        if !material.is_active || material.is_discontinued {
            return Err(MaterialError::Validation(
                "Material is already inactive or discontinued".to_string(),
            ));
        }

        self.db.execute(
            r#"
            UPDATE materials SET
                is_active = 0,
                is_discontinued = 1,
                updated_at = ?,
                updated_by = ?,
                deleted_at = ?,
                deleted_by = ?
            WHERE id = ?
            "#,
            params![
                crate::shared::contracts::common::now(),
                Some(deleted_by.clone()),
                crate::shared::contracts::common::now(),
                Some(deleted_by),
                id
            ],
        )?;

        Ok(())
    }

    // ── Atomic stock / consumption writes ────────────────────────────────────

    /// Update material stock level.
    pub fn update_stock(&self, request: UpdateStockRequest) -> MaterialResult<Material> {
        let recorded_by = request
            .recorded_by
            .clone()
            .filter(|user_id| !user_id.trim().is_empty())
            .ok_or_else(|| {
                MaterialError::Authorization("User ID is required to update stock".to_string())
            })?;
        self.validate_stock_update(&request)?;
        let mut material = self.get_material(&request.material_id)?.ok_or_else(|| {
            MaterialError::NotFound(format!("Material {} not found", request.material_id))
        })?;
        self.ensure_material_active(&material)?;

        let new_stock = material.current_stock + request.quantity_change;
        if new_stock < 0.0 {
            return Err(MaterialError::InsufficientStock(format!(
                "Cannot reduce stock below 0. Current: {}, Requested change: {}",
                material.current_stock, request.quantity_change
            )));
        }

        if let Some(max_stock) = material.maximum_stock {
            if new_stock > max_stock {
                return Err(MaterialError::Validation(format!(
                    "New stock {} would exceed maximum stock limit of {}",
                    new_stock, max_stock
                )));
            }
        }

        material.current_stock = new_stock;
        material.updated_at = crate::shared::contracts::common::now();
        material.updated_by = Some(recorded_by);

        self.save_material(&material)?;
        Ok(material)
    }

    /// Record material consumption for an intervention.
    ///
    /// Atomically inserts the consumption record, appends an audit transaction,
    /// and decrements `materials.current_stock` in a single DB transaction.
    pub fn record_consumption(
        &self,
        request: RecordConsumptionRequest,
    ) -> MaterialResult<MaterialConsumption> {
        let recorded_by = request
            .recorded_by
            .clone()
            .filter(|user_id| !user_id.trim().is_empty())
            .ok_or_else(|| {
                MaterialError::Authorization(
                    "User ID is required to record consumption".to_string(),
                )
            })?;
        self.validate_consumption_request(&request)?;
        let material = self.get_material(&request.material_id)?.ok_or_else(|| {
            MaterialError::NotFound(format!("Material {} not found", request.material_id))
        })?;
        self.ensure_material_active(&material)?;

        if material.is_expired() {
            return Err(MaterialError::ExpiredMaterial(format!(
                "Material {} is expired",
                material.name
            )));
        }

        let waste_quantity = request.waste_quantity.unwrap_or(0.0);
        let total_needed = request.quantity_used + waste_quantity;
        if material.current_stock < total_needed {
            return Err(MaterialError::InsufficientStock(format!(
                "Material {} has insufficient stock. Available: {}, Needed: {}",
                material.name, material.current_stock, total_needed
            )));
        }

        let intervention_id = request.intervention_id.clone();
        let material_id = request.material_id.clone();
        let recorded_by = recorded_by.clone();

        let id = Uuid::new_v4().to_string();
        let mut consumption = MaterialConsumption::new(
            id,
            intervention_id.clone(),
            material_id.clone(),
            request.quantity_used,
        );

        consumption.step_id = request.step_id;
        consumption.step_number = request.step_number;
        consumption.waste_quantity = waste_quantity;
        consumption.waste_reason = request.waste_reason;
        consumption.batch_used = request.batch_used;
        consumption.quality_notes = request.quality_notes;
        consumption.recorded_by = Some(recorded_by.clone());
        consumption.unit_cost = material.unit_cost;
        consumption.calculate_total_cost();

        let new_stock = material.current_stock - total_needed;
        let material_id_for_update = material_id.clone();
        let recorded_by_for_update = recorded_by.clone();
        let now = crate::shared::contracts::common::now();
        let total_used = total_needed;
        let transaction = InventoryTransaction {
            id: Uuid::new_v4().to_string(),
            material_id: material_id.clone(),
            transaction_type: InventoryTransactionType::StockOut,
            quantity: total_used,
            previous_stock: material.current_stock,
            new_stock,
            reference_number: Some(consumption.id.clone()),
            reference_type: Some("consumption".to_string()),
            notes: Some("Intervention consumption".to_string()),
            unit_cost: material.unit_cost,
            total_cost: consumption.total_cost,
            warehouse_id: material.warehouse_id.clone(),
            location_from: None,
            location_to: None,
            batch_number: consumption.batch_used.clone(),
            expiry_date: consumption.expiry_used,
            quality_status: None,
            intervention_id: Some(consumption.intervention_id.clone()),
            step_id: consumption.step_id.clone(),
            performed_by: recorded_by.clone(),
            performed_at: now,
            created_at: now,
            updated_at: now,
            synced: false,
            last_synced_at: None,
        };
        self.db
            .with_transaction(|tx| {
                tx.execute(
                    r#"
                    INSERT INTO material_consumption (
                        id, intervention_id, material_id, step_id, quantity_used, unit_cost,
                        total_cost, waste_quantity, waste_reason, batch_used, expiry_used,
                        quality_notes, step_number, recorded_by, recorded_at, created_at,
                        updated_at, synced, last_synced_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    "#,
                    params![
                        consumption.id,
                        consumption.intervention_id,
                        consumption.material_id,
                        consumption.step_id,
                        consumption.quantity_used,
                        consumption.unit_cost,
                        consumption.total_cost,
                        consumption.waste_quantity,
                        consumption.waste_reason,
                        consumption.batch_used,
                        consumption.expiry_used,
                        consumption.quality_notes,
                        consumption.step_number,
                        consumption.recorded_by,
                        consumption.recorded_at,
                        consumption.created_at,
                        consumption.updated_at,
                        consumption.synced,
                        consumption.last_synced_at,
                    ],
                )
                .map_err(|e| e.to_string())?;
                tx.execute(
                    r#"
                    INSERT INTO inventory_transactions (
                        id, material_id, transaction_type, quantity, previous_stock, new_stock,
                        reference_number, reference_type, notes, unit_cost, total_cost,
                        warehouse_id, location_from, location_to, batch_number, expiry_date, quality_status,
                        intervention_id, step_id, performed_by, performed_at, created_at, updated_at, synced, last_synced_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    "#,
                    params![
                        transaction.id,
                        transaction.material_id,
                        transaction.transaction_type.to_string(),
                        transaction.quantity,
                        transaction.previous_stock,
                        transaction.new_stock,
                        transaction.reference_number,
                        transaction.reference_type,
                        transaction.notes,
                        transaction.unit_cost,
                        transaction.total_cost,
                        transaction.warehouse_id,
                        transaction.location_from,
                        transaction.location_to,
                        transaction.batch_number,
                        transaction.expiry_date,
                        transaction.quality_status,
                        transaction.intervention_id,
                        transaction.step_id,
                        transaction.performed_by,
                        transaction.performed_at,
                        transaction.created_at,
                        transaction.updated_at,
                        transaction.synced,
                        transaction.last_synced_at,
                    ],
                )
                .map_err(|e| e.to_string())?;
                tx.execute(
                    "UPDATE materials SET current_stock = ?, updated_at = ?, updated_by = ? WHERE id = ?",
                    params![
                        new_stock,
                        now,
                        Some(recorded_by_for_update),
                        material_id_for_update
                    ],
                )
                .map_err(|e| e.to_string())?;
                Ok(())
            })
            .map_err(MaterialError::Database)?;

        Ok(consumption)
    }

    /// Create an inventory transaction and atomically update stock.
    pub fn create_inventory_transaction(
        &self,
        request: CreateInventoryTransactionRequest,
        user_id: &str,
    ) -> MaterialResult<InventoryTransaction> {
        if request.quantity.is_nan() || request.quantity.is_infinite() {
            return Err(MaterialError::Validation(
                "Transaction quantity must be a finite number".to_string(),
            ));
        }

        if !matches!(
            request.transaction_type,
            InventoryTransactionType::Adjustment
        ) && request.quantity <= 0.0
        {
            return Err(MaterialError::Validation(
                "Transaction quantity must be greater than 0".to_string(),
            ));
        }

        if matches!(
            request.transaction_type,
            InventoryTransactionType::Adjustment
        ) && request.quantity < 0.0
        {
            return Err(MaterialError::Validation(
                "Adjustment quantity cannot be negative".to_string(),
            ));
        }

        let material = self.get_material(&request.material_id)?.ok_or_else(|| {
            MaterialError::NotFound(format!("Material {} not found", request.material_id))
        })?;
        self.ensure_material_active(&material)?;

        let previous_stock = material.current_stock;

        let new_stock = match request.transaction_type {
            InventoryTransactionType::StockIn | InventoryTransactionType::Return => {
                previous_stock + request.quantity
            }
            InventoryTransactionType::StockOut
            | InventoryTransactionType::Waste
            | InventoryTransactionType::Transfer => {
                if previous_stock < request.quantity {
                    return Err(MaterialError::InsufficientStock(format!(
                        "Insufficient stock: {} available, {} requested",
                        previous_stock, request.quantity
                    )));
                }
                previous_stock - request.quantity
            }
            InventoryTransactionType::Adjustment => request.quantity,
        };

        if new_stock < 0.0 {
            return Err(MaterialError::InsufficientStock(format!(
                "Cannot set stock below 0. Current: {}, Requested: {}",
                previous_stock, new_stock
            )));
        }

        if let Some(max_stock) = material.maximum_stock {
            if new_stock > max_stock {
                return Err(MaterialError::Validation(format!(
                    "New stock {} would exceed maximum stock limit of {}",
                    new_stock, max_stock
                )));
            }
        }

        let id = Uuid::new_v4().to_string();
        let total_cost = request.unit_cost.map(|uc| uc * request.quantity);

        let transaction = InventoryTransaction {
            id,
            material_id: request.material_id.clone(),
            transaction_type: request.transaction_type.clone(),
            quantity: request.quantity,
            previous_stock,
            new_stock,
            reference_number: request.reference_number.clone(),
            reference_type: request.reference_type.clone(),
            notes: request.notes.clone(),
            unit_cost: request.unit_cost,
            total_cost,
            warehouse_id: request.warehouse_id.clone(),
            location_from: request.location_from.clone(),
            location_to: request.location_to.clone(),
            batch_number: request.batch_number.clone(),
            expiry_date: request.expiry_date,
            quality_status: request.quality_status.clone(),
            intervention_id: request.intervention_id.clone(),
            step_id: request.step_id.clone(),
            performed_by: user_id.to_string(),
            performed_at: crate::shared::contracts::common::now(),
            created_at: crate::shared::contracts::common::now(),
            updated_at: crate::shared::contracts::common::now(),
            synced: false,
            last_synced_at: None,
        };

        let material_id_for_update = request.material_id.clone();
        let updated_by = user_id.to_string();
        let now = crate::shared::contracts::common::now();
        self.db
            .with_transaction(|tx| {
                tx.execute(
                    r#"
                    INSERT INTO inventory_transactions (
                        id, material_id, transaction_type, quantity, previous_stock, new_stock,
                        reference_number, reference_type, notes, unit_cost, total_cost,
                        warehouse_id, location_from, location_to, batch_number, expiry_date, quality_status,
                        intervention_id, step_id, performed_by, performed_at, created_at, updated_at, synced, last_synced_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    "#,
                    params![
                        transaction.id,
                        transaction.material_id,
                        transaction.transaction_type.to_string(),
                        transaction.quantity,
                        transaction.previous_stock,
                        transaction.new_stock,
                        transaction.reference_number,
                        transaction.reference_type,
                        transaction.notes,
                        transaction.unit_cost,
                        transaction.total_cost,
                        transaction.warehouse_id,
                        transaction.location_from,
                        transaction.location_to,
                        transaction.batch_number,
                        transaction.expiry_date,
                        transaction.quality_status,
                        transaction.intervention_id,
                        transaction.step_id,
                        transaction.performed_by,
                        transaction.performed_at,
                        transaction.created_at,
                        transaction.updated_at,
                        transaction.synced,
                        transaction.last_synced_at,
                    ],
                )
                .map_err(|e| e.to_string())?;
                tx.execute(
                    "UPDATE materials SET current_stock = ?, updated_at = ?, updated_by = ? WHERE id = ?",
                    params![new_stock, now, Some(updated_by), material_id_for_update],
                )
                .map_err(|e| e.to_string())?;
                Ok(())
            })
            .map_err(MaterialError::Database)?;

        Ok(transaction)
    }

    // ── Stats and read queries ────────────────────────────────────────────────

    /// Get material statistics.
    pub fn get_material_stats(&self) -> MaterialResult<MaterialStats> {
        let total_materials: i32 = self
            .db
            .query_single_value("SELECT COUNT(*) FROM materials", [])?;

        let active_materials: i32 = self
            .db
            .query_single_value("SELECT COUNT(*) FROM materials WHERE is_active = 1", [])?;

        let low_stock_materials: i32 = self.db.query_single_value(
            r#"
            SELECT COUNT(*) FROM materials
            WHERE is_active = 1
              AND (current_stock - 0.0) <= COALESCE(minimum_stock, ?)
            "#,
            params![DEFAULT_LOW_STOCK_THRESHOLD],
        )?;

        let expired_materials: i32 = self.db.query_single_value(
            r#"
            SELECT COUNT(*) FROM materials
            WHERE is_active = 1
              AND expiry_date IS NOT NULL
              AND expiry_date <= ?
            "#,
            params![crate::shared::contracts::common::now()],
        )?;

        let total_value: f64 = self.db.query_single_value(
            r#"
            SELECT COALESCE(SUM(current_stock * unit_cost), 0)
            FROM materials
            WHERE unit_cost IS NOT NULL AND is_active = 1
            "#,
            [],
        )?;

        let conn = self.db.get_connection()?;
        let mut stmt = conn.prepare(
            "SELECT material_type, COUNT(*) as count FROM materials WHERE is_active = 1 GROUP BY material_type",
        )?;
        let type_rows = stmt
            .query_map([], |row| {
                Ok((row.get::<_, String>(0)?, row.get::<_, i32>(1)?))
            })?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| MaterialError::Database(e.to_string()))?;

        let materials_by_type: HashMap<String, i32> = type_rows.into_iter().collect();

        Ok(MaterialStats {
            total_materials,
            active_materials,
            low_stock_materials,
            expired_materials,
            total_value,
            materials_by_type,
        })
    }

    /// Get low-stock materials according to the configured threshold policy.
    pub fn get_low_stock_materials(&self) -> MaterialResult<LowStockMaterialsResponse> {
        let threshold_fallback = effective_threshold(None);
        let sql = r#"
            SELECT
              id                                    AS material_id,
              sku,
              name,
              unit_of_measure,
              current_stock,
              0.0                                   AS reserved_stock,
              current_stock                         AS available_stock,
              COALESCE(minimum_stock, ?)            AS minimum_stock,
              COALESCE(minimum_stock, ?)            AS effective_threshold,
              CASE
                WHEN current_stock < COALESCE(minimum_stock, ?)
                  THEN COALESCE(minimum_stock, ?) - current_stock
                ELSE 0.0
              END                                   AS shortage_quantity
            FROM materials
            WHERE is_active = 1
              AND current_stock <= COALESCE(minimum_stock, ?)
            ORDER BY shortage_quantity DESC, available_stock ASC, name ASC
        "#;

        let items = self.db.query_as::<LowStockMaterial>(
            sql,
            params![
                threshold_fallback,
                threshold_fallback,
                threshold_fallback,
                threshold_fallback,
                threshold_fallback
            ],
        )?;

        Ok(LowStockMaterialsResponse {
            total: items.len() as i32,
            items,
        })
    }

    /// Get expired materials.
    pub fn get_expired_materials(&self) -> MaterialResult<Vec<Material>> {
        let sql = r#"
            SELECT * FROM materials
            WHERE is_active = 1
              AND expiry_date IS NOT NULL
              AND expiry_date <= ?
            ORDER BY expiry_date ASC
        "#;

        Ok(self
            .db
            .query_as::<Material>(sql, params![crate::shared::contracts::common::now()])?)
    }

    /// Get material consumption summary for an intervention.
    ///
    /// N+1 fix: fetches all materials in a single batch query instead of one query
    /// per consumption row.
    pub fn get_intervention_material_summary(
        &self,
        intervention_id: &str,
    ) -> MaterialResult<InterventionMaterialSummary> {
        let consumptions = self.consumption.get_intervention_consumption(intervention_id)?;

        // Batch-load all referenced materials in one query.
        let material_ids: Vec<&str> = consumptions
            .iter()
            .map(|c| c.material_id.as_str())
            .collect();
        let materials_map = self.get_materials_by_ids(&material_ids)?;

        let mut total_cost = 0.0;
        let mut materials = Vec::new();

        for consumption in consumptions {
            if let Some(material) = materials_map.get(&consumption.material_id) {
                let summary = MaterialConsumptionSummary {
                    material_id: material.id.clone(),
                    material_name: material.name.clone(),
                    material_type: material.material_type.to_string(),
                    quantity_used: consumption.quantity_used,
                    unit_cost: consumption.unit_cost,
                    total_cost: consumption.total_cost,
                    waste_quantity: consumption.waste_quantity,
                };
                materials.push(summary);

                if let Some(cost) = consumption.total_cost {
                    total_cost += cost;
                }
            }
        }

        Ok(InterventionMaterialSummary {
            intervention_id: intervention_id.to_string(),
            total_materials_used: materials.len() as i32,
            total_cost,
            materials,
        })
    }

    // ── Delegation to sub-repositories ───────────────────────────────────────

    // -- Category --

    pub fn create_material_category(
        &self,
        request: CreateMaterialCategoryRequest,
        created_by: Option<String>,
    ) -> MaterialResult<MaterialCategory> {
        self.categories.create_material_category(request, created_by)
    }

    pub fn get_material_category(&self, id: &str) -> MaterialResult<Option<MaterialCategory>> {
        self.categories.get_material_category(id)
    }

    pub fn list_material_categories(
        &self,
        active_only: bool,
        limit: Option<i32>,
        offset: Option<i32>,
    ) -> MaterialResult<Vec<MaterialCategory>> {
        self.categories.list_material_categories(active_only, limit, offset)
    }

    pub fn update_material_category(
        &self,
        id: &str,
        request: CreateMaterialCategoryRequest,
        updated_by: Option<String>,
    ) -> MaterialResult<MaterialCategory> {
        self.categories.update_material_category(id, request, updated_by)
    }

    // -- Supplier --

    pub fn create_supplier(
        &self,
        request: CreateSupplierRequest,
        created_by: Option<String>,
    ) -> MaterialResult<Supplier> {
        self.suppliers.create_supplier(request, created_by)
    }

    pub fn get_supplier(&self, id: &str) -> MaterialResult<Option<Supplier>> {
        self.suppliers.get_supplier(id)
    }

    pub fn list_suppliers(
        &self,
        active_only: bool,
        preferred_only: Option<bool>,
        limit: Option<i32>,
        offset: Option<i32>,
    ) -> MaterialResult<Vec<Supplier>> {
        self.suppliers.list_suppliers(active_only, preferred_only, limit, offset)
    }

    pub fn update_supplier(
        &self,
        id: &str,
        request: CreateSupplierRequest,
        updated_by: Option<String>,
    ) -> MaterialResult<Supplier> {
        self.suppliers.update_supplier(id, request, updated_by)
    }

    // -- Consumption reads --

    pub fn get_intervention_consumption(
        &self,
        intervention_id: &str,
    ) -> MaterialResult<Vec<MaterialConsumption>> {
        self.consumption.get_intervention_consumption(intervention_id)
    }

    pub fn get_consumption_history(
        &self,
        material_id: &str,
        limit: Option<i32>,
        offset: Option<i32>,
    ) -> MaterialResult<Vec<MaterialConsumption>> {
        self.consumption.get_consumption_history(material_id, limit, offset)
    }

    // -- Transaction reads / stats --

    pub fn list_inventory_transactions_by_material(
        &self,
        material_id: &str,
        transaction_type: Option<InventoryTransactionType>,
        limit: Option<i32>,
        offset: Option<i32>,
    ) -> MaterialResult<Vec<InventoryTransaction>> {
        self.transactions
            .list_inventory_transactions_by_material(material_id, transaction_type, limit, offset)
    }

    pub fn list_recent_inventory_transactions(
        &self,
        limit: i32,
    ) -> MaterialResult<Vec<InventoryTransaction>> {
        self.transactions.list_recent_inventory_transactions(limit)
    }

    pub fn get_inventory_stats(&self) -> MaterialResult<InventoryStats> {
        self.transactions.get_inventory_stats()
    }

    pub fn get_inventory_movement_summary(
        &self,
        material_id: Option<&str>,
        date_from: Option<&str>,
        date_to: Option<&str>,
    ) -> MaterialResult<Vec<InventoryMovementSummary>> {
        self.transactions
            .get_inventory_movement_summary(material_id, date_from, date_to)
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    fn validate_create_request(&self, request: &CreateMaterialRequest) -> MaterialResult<()> {
        if request.sku.trim().is_empty() {
            return Err(MaterialError::Validation("SKU is required".to_string()));
        }

        if request.name.trim().is_empty() {
            return Err(MaterialError::Validation("Name is required".to_string()));
        }

        self.validate_stock_thresholds(
            request.minimum_stock,
            request.maximum_stock,
            request.reorder_point,
        )?;

        if let Ok(Some(_)) = self.get_material_by_sku(&request.sku) {
            return Err(MaterialError::Validation(format!(
                "SKU {} already exists",
                request.sku
            )));
        }

        Ok(())
    }

    fn validate_update_request(
        &self,
        id: &str,
        request: &CreateMaterialRequest,
    ) -> MaterialResult<()> {
        if request.sku.trim().is_empty() {
            return Err(MaterialError::Validation("SKU is required".to_string()));
        }

        if request.name.trim().is_empty() {
            return Err(MaterialError::Validation("Name is required".to_string()));
        }

        self.validate_stock_thresholds(
            request.minimum_stock,
            request.maximum_stock,
            request.reorder_point,
        )?;

        if let Ok(Some(existing)) = self.get_material_by_sku(&request.sku) {
            if existing.id != id {
                return Err(MaterialError::Validation(format!(
                    "SKU {} already exists",
                    request.sku
                )));
            }
        }

        Ok(())
    }

    fn validate_stock_thresholds(
        &self,
        minimum_stock: Option<f64>,
        maximum_stock: Option<f64>,
        reorder_point: Option<f64>,
    ) -> MaterialResult<()> {
        if let Some(min_stock) = minimum_stock {
            if !min_stock.is_finite() || min_stock < 0.0 {
                return Err(MaterialError::Validation(
                    "Minimum stock must be a non-negative number".to_string(),
                ));
            }
        }

        if let Some(max_stock) = maximum_stock {
            if !max_stock.is_finite() || max_stock < 0.0 {
                return Err(MaterialError::Validation(
                    "Maximum stock must be a non-negative number".to_string(),
                ));
            }
        }

        if let (Some(min_stock), Some(max_stock)) = (minimum_stock, maximum_stock) {
            if min_stock > max_stock {
                return Err(MaterialError::Validation(
                    "Minimum stock cannot exceed maximum stock".to_string(),
                ));
            }
        }

        if let Some(reorder_point) = reorder_point {
            if !reorder_point.is_finite() || reorder_point < 0.0 {
                return Err(MaterialError::Validation(
                    "Reorder point must be a non-negative number".to_string(),
                ));
            }
            if let Some(max_stock) = maximum_stock {
                if reorder_point > max_stock {
                    return Err(MaterialError::Validation(
                        "Reorder point cannot exceed maximum stock".to_string(),
                    ));
                }
            }
        }

        Ok(())
    }

    fn save_material(&self, material: &Material) -> MaterialResult<()> {
        let exists: i32 = self.db.query_single_value(
            "SELECT COUNT(*) FROM materials WHERE id = ?",
            params![material.id],
        )?;

        let material_type_str = material.material_type.to_string();
        let unit_str = material.unit_of_measure.to_string();

        if exists > 0 {
            self.db.execute(
                r#"
                UPDATE materials SET
                    sku = ?, name = ?, description = ?, material_type = ?, category = ?,
                    subcategory = ?, brand = ?, model = ?, specifications = ?,
                    unit_of_measure = ?, current_stock = ?, minimum_stock = ?, maximum_stock = ?,
                    reorder_point = ?, unit_cost = ?, currency = ?, supplier_id = ?,
                    supplier_name = ?, supplier_sku = ?, quality_grade = ?, certification = ?,
                    expiry_date = ?, batch_number = ?, serial_numbers = ?, is_active = ?,
                    is_discontinued = ?, storage_location = ?, warehouse_id = ?,
                    updated_at = ?, updated_by = ?, synced = ?, last_synced_at = ?
                WHERE id = ?
                "#,
                params![
                    material.sku,
                    material.name,
                    material.description,
                    material_type_str,
                    material.category,
                    material.subcategory,
                    material.brand,
                    material.model,
                    material
                        .specifications
                        .as_ref()
                        .map(|s| serde_json::to_string(s).unwrap_or_default()),
                    unit_str,
                    material.current_stock,
                    material.minimum_stock,
                    material.maximum_stock,
                    material.reorder_point,
                    material.unit_cost,
                    material.currency,
                    material.supplier_id,
                    material.supplier_name,
                    material.supplier_sku,
                    material.quality_grade,
                    material.certification,
                    material.expiry_date,
                    material.batch_number,
                    material
                        .serial_numbers
                        .as_ref()
                        .map(|s| serde_json::to_string(s).unwrap_or_default()),
                    material.is_active,
                    material.is_discontinued,
                    material.storage_location,
                    material.warehouse_id,
                    material.updated_at,
                    material.updated_by,
                    material.synced,
                    material.last_synced_at,
                    material.id,
                ],
            )?;
        } else {
            self.db.execute(
                r#"
                INSERT INTO materials (
                    id, sku, name, description, material_type, category, subcategory, category_id,
                    brand, model, specifications, unit_of_measure, current_stock,
                    minimum_stock, maximum_stock, reorder_point, unit_cost, currency,
                    supplier_id, supplier_name, supplier_sku, quality_grade, certification,
                    expiry_date, batch_number, serial_numbers, is_active, is_discontinued,
                    storage_location, warehouse_id, created_at, updated_at, created_by,
                    updated_by, synced, last_synced_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                "#,
                params![
                    material.id,
                    material.sku,
                    material.name,
                    material.description,
                    material_type_str,
                    material.category,
                    material.subcategory,
                    material.category_id,
                    material.brand,
                    material.model,
                    material.specifications.as_ref().map(|s| serde_json::to_string(s).unwrap_or_default()),
                    unit_str,
                    material.current_stock,
                    material.minimum_stock,
                    material.maximum_stock,
                    material.reorder_point,
                    material.unit_cost,
                    material.currency,
                    material.supplier_id,
                    material.supplier_name,
                    material.supplier_sku,
                    material.quality_grade,
                    material.certification,
                    material.expiry_date,
                    material.batch_number,
                    material.serial_numbers.as_ref().map(|s| serde_json::to_string(s).unwrap_or_default()),
                    material.is_active,
                    material.is_discontinued,
                    material.storage_location,
                    material.warehouse_id,
                    material.created_at,
                    material.updated_at,
                    material.created_by,
                    material.updated_by,
                    material.synced,
                    material.last_synced_at,
                ],
            )?;
        }

        Ok(())
    }

    fn ensure_material_active(&self, material: &Material) -> MaterialResult<()> {
        if material.is_discontinued {
            return Err(MaterialError::Validation(
                "Material is discontinued".to_string(),
            ));
        }
        if !material.is_active {
            return Err(MaterialError::Validation(
                "Material is inactive".to_string(),
            ));
        }
        Ok(())
    }

    fn validate_stock_update(&self, request: &UpdateStockRequest) -> MaterialResult<()> {
        if request.material_id.trim().is_empty() {
            return Err(MaterialError::Validation(
                "Material ID is required".to_string(),
            ));
        }

        if request.reason.trim().is_empty() {
            return Err(MaterialError::Validation(
                "Stock update reason is required".to_string(),
            ));
        }

        if !request.quantity_change.is_finite() {
            return Err(MaterialError::Validation(
                "Stock change must be a finite number".to_string(),
            ));
        }

        if request.quantity_change == 0.0 {
            return Err(MaterialError::Validation(
                "Stock change cannot be zero".to_string(),
            ));
        }

        Ok(())
    }

    fn validate_consumption_request(
        &self,
        request: &RecordConsumptionRequest,
    ) -> MaterialResult<()> {
        if request.material_id.trim().is_empty() {
            return Err(MaterialError::Validation(
                "Material ID is required".to_string(),
            ));
        }

        if request.intervention_id.trim().is_empty() {
            return Err(MaterialError::Validation(
                "Intervention ID is required".to_string(),
            ));
        }

        if !request.quantity_used.is_finite() || request.quantity_used <= 0.0 {
            return Err(MaterialError::Validation(
                "Quantity used must be greater than 0".to_string(),
            ));
        }

        if let Some(waste_quantity) = request.waste_quantity {
            if !waste_quantity.is_finite() || waste_quantity < 0.0 {
                return Err(MaterialError::Validation(
                    "Waste quantity must be a non-negative number".to_string(),
                ));
            }
        }

        Ok(())
    }
}

#[cfg(test)]
mod inventory_ipc_fix_tests {
    use super::*;
    use crate::test_utils::TestDatabase;

    #[test]
    fn test_inventory_get_stats_empty_db() {
        let test_db = TestDatabase::new().expect("Failed to create test database");
        let db = (*test_db.db()).clone();
        let service = MaterialService::new(db);

        let result = service.get_inventory_stats();
        assert!(
            result.is_ok(),
            "get_inventory_stats should succeed on empty DB, got: {:?}",
            result.err()
        );

        let stats = result.unwrap();
        assert_eq!(stats.total_materials, 0);
        assert_eq!(stats.active_materials, 0);
        assert_eq!(stats.low_stock_materials, 0);
        assert_eq!(stats.expired_materials, 0);
        assert_eq!(stats.total_value, 0.0);
        assert!(stats.recent_transactions.is_empty());
    }

    #[test]
    fn test_material_list_categories_empty_db() {
        let test_db = TestDatabase::new().expect("Failed to create test database");
        let db = (*test_db.db()).clone();
        let service = MaterialService::new(db);

        let result = service.list_material_categories(true, None, None);
        assert!(
            result.is_ok(),
            "list_material_categories should succeed on empty DB, got: {:?}",
            result.err()
        );
    }

    #[test]
    fn test_material_list_categories_with_pagination_empty_db() {
        let test_db = TestDatabase::new().expect("Failed to create test database");
        let db = (*test_db.db()).clone();
        let service = MaterialService::new(db);

        let result = service.list_material_categories(true, Some(10), Some(0));
        assert!(
            result.is_ok(),
            "list_material_categories with pagination should succeed on empty DB, got: {:?}",
            result.err()
        );
    }

    #[test]
    fn test_inventory_movement_summary_empty_db() {
        let test_db = TestDatabase::new().expect("Failed to create test database");
        let db = (*test_db.db()).clone();
        let service = MaterialService::new(db);

        let result = service.get_inventory_movement_summary(None, None, None);
        assert!(
            result.is_ok(),
            "get_inventory_movement_summary should succeed on empty DB, got: {:?}",
            result.err()
        );
        assert!(result.unwrap().is_empty());
    }

    #[test]
    fn test_inventory_movement_summary_with_date_range_empty_db() {
        let test_db = TestDatabase::new().expect("Failed to create test database");
        let db = (*test_db.db()).clone();
        let service = MaterialService::new(db);

        let result =
            service.get_inventory_movement_summary(None, Some("2024-01-01"), Some("2024-12-31"));
        assert!(
            result.is_ok(),
            "movement summary with dates should succeed on empty DB, got: {:?}",
            result.err()
        );
        assert!(result.unwrap().is_empty());
    }
}
