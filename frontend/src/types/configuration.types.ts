/**
 * Configuration Types
 *
 * Type definitions for configuration management
 */

export interface ConfigurationItem {
  id: string;
  category: string;
  key: string;
  value: string | number | boolean;
  description?: string;
  data_type: "string" | "number" | "boolean" | "json";
  is_required: boolean;
  isRequired?: boolean;
  default_value?: string;
  validation_rules?: string;
  isEncrypted?: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface ConfigurationCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessRule {
  id: string;
  name: string;
  category: string;
  description?: string;
  conditions: RuleCondition[];
  actions: RuleAction[];
  priority: number;
  is_active: boolean;
  isActive?: boolean;
  created_at: string;
  updated_at: string;
  createdAt?: string;
}

export type RuleOperator =
  | "equals"
  | "not_equals"
  | "greater_than"
  | "less_than"
  | "contains"
  | "not_contains"
  | "in"
  | "not_in"
  | "is_null"
  | "is_not_null";

export type RuleActionType =
  | "set_field"
  | "send_notification"
  | "create_task"
  | "assign_user"
  | "change_status"
  | "execute_workflow"
  | "log_event"
  | "assign_task"
  | "update_priority"
  | "block_completion"
  | "notify_manager"
  | "notify_technician"
  | "escalate";

export interface RuleCondition {
  field: string;
  operator: RuleOperator;
  value: string | number | boolean | string[];
}

export interface RuleAction {
  type: RuleActionType;
  target: string;
  value: string | number | boolean | Record<string, unknown>;
}

export type BusinessRuleCategory =
  | "task"
  | "client"
  | "workflow"
  | "system"
  | "task_assignment"
  | "notification"
  | "validation"
  | "automation"
  | "escalation";

export interface IntegrationConfig {
  id: string;
  type: IntegrationType;
  name: string;
  config: Record<string, string | number | boolean>;
  status: IntegrationStatus;
  last_sync?: string;
  lastSync?: string;
  provider?: string;
  isActive?: boolean;
  settings?: Record<string, string | number | boolean>;
  credentials?: {
    encrypted: boolean;
    data: string;
  };
  createdAt?: string;
  updatedAt?: string;
  healthCheck?: {
    status: "healthy" | "unhealthy" | "warning";
    lastChecked: string;
    responseTime?: number;
    error?: string;
    details?: Record<string, unknown>;
  };
}

export type BackendRuleStatus = "draft" | "active" | "disabled";
export type BackendRuleMode = "blocking" | "reactive";
export type BackendRuleTrigger =
  | "task_created"
  | "task_status_changed"
  | "intervention_started"
  | "intervention_finalized";

export type BackendRuleAction =
  | { type: "block"; message: string }
  | {
      type: "queue_integration";
      event_name: string;
      integration_ids?: string[] | null;
    };

export interface BackendRuleDefinition {
  id: string;
  name: string;
  description?: string | null;
  template_key: string;
  trigger: BackendRuleTrigger;
  mode: BackendRuleMode;
  status: BackendRuleStatus;
  conditions: unknown;
  actions: BackendRuleAction[];
  created_at: number;
  updated_at: number;
  deleted_at?: number | null;
}

export interface CreateBackendRuleRequest {
  name: string;
  description?: string | null;
  template_key: string;
  trigger: BackendRuleTrigger;
  mode: BackendRuleMode;
  conditions: unknown;
  actions: BackendRuleAction[];
}

export interface UpdateBackendRuleRequest {
  name?: string;
  description?: string | null;
  template_key?: string;
  trigger?: BackendRuleTrigger;
  mode?: BackendRuleMode;
  conditions?: unknown;
  actions?: BackendRuleAction[];
  status?: BackendRuleStatus;
}

export interface BackendRuleEvaluationResult {
  allowed: boolean;
  matched_rule_ids: string[];
  message?: string | null;
  queued_actions: BackendRuleAction[];
}

export interface TestBackendRuleRequest {
  trigger: BackendRuleTrigger;
  entity_id?: string | null;
  payload: unknown;
}

export type BackendIntegrationKind = "webhook";
export type BackendIntegrationStatus = "draft" | "active" | "disabled";
export type BackendDeliveryStatus =
  | "pending"
  | "processing"
  | "retrying"
  | "delivered"
  | "dead_letter";

export interface BackendIntegrationConfig {
  id: string;
  name: string;
  description?: string | null;
  kind: BackendIntegrationKind;
  status: BackendIntegrationStatus;
  endpoint_url: string;
  headers: Record<string, string>;
  subscribed_events: string[];
  has_secret: boolean;
  last_tested_at?: number | null;
  created_at: number;
  updated_at: number;
  deleted_at?: number | null;
}

export interface CreateBackendIntegrationRequest {
  name: string;
  description?: string | null;
  endpoint_url: string;
  headers: Record<string, string>;
  subscribed_events: string[];
  secret_token?: string | null;
}

export interface UpdateBackendIntegrationRequest {
  name?: string;
  description?: string | null;
  endpoint_url?: string;
  headers?: Record<string, string> | null;
  subscribed_events?: string[];
  status?: BackendIntegrationStatus;
  secret_token?: string | null;
}

export interface TestBackendIntegrationResponse {
  success: boolean;
  message: string;
  tested_at: number;
}

export type IntegrationType =
  | "email"
  | "sms"
  | "calendar"
  | "webhook"
  | "api"
  | "backup"
  | "sync";

export type IntegrationStatus =
  | "active"
  | "inactive"
  | "error"
  | "pending"
  | "testing";

export interface MonitoringConfig {
  id: string;
  category: string;
  name: string;
  enabled: boolean;
  config: Record<string, string | number | boolean>;
}

export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  policy_type: SecurityPolicyType;
  type: SecurityPolicyType;
  is_active: boolean;
  isActive?: boolean;
  applies_to: string[];
  appliesTo?: string[];
  settings: Record<string, unknown>;
  exceptions?: SecurityPolicyException[];
  created_at: string;
  updated_at: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SecurityPolicyException {
  id: string;
  user_id?: string;
  role?: string;
  condition: string;
  reason: string;
  created_at: string;
  expires_at?: string;
}

export type SecurityPolicyType =
  | "password"
  | "session"
  | "api_rate_limit"
  | "encryption"
  | "access_control"
  | "authentication"
  | "authorization"
  | "data_protection"
  | "compliance";

export interface SystemStatus {
  status: "healthy" | "warning" | "error";
  components: Record<
    string,
    {
      status: "healthy" | "warning" | "error";
      message?: string;
      lastChecked: string;
    }
  >;
  timestamp: string;
}

export interface ConfigurationFilters {
  category?: string;
  search?: string;
  data_type?: string;
  is_required?: boolean;
  page?: number;
  limit?: number;
  pageSize?: number;
  sortBy?: string;
  type?: string;
  isRequired?: boolean;
  isEncrypted?: boolean;
}

export interface BusinessRuleFilters {
  search?: string;
  category?: string;
  status?: "active" | "inactive" | "all";
  priority?: "low" | "medium" | "high" | "all";
  page?: number;
  limit?: number;
  pageSize?: number;
  isActive?: boolean;
}

export interface SecurityPolicyFilters {
  search?: string;
  policy_type?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
}

// Additional types needed for API routes
export interface BusinessHoursConfig {
  enabled: boolean;
  timezone: string;
  schedule: Record<string, { start: string; end: string; enabled: boolean }>;
}

export type { SystemConfiguration } from "@/lib/backend";

export interface ConfigurationFiltersData extends ConfigurationFilters {
  pageSize?: number;
}

export interface BusinessRuleFiltersData extends BusinessRuleFilters {
  isActive?: boolean;
}

export type PerformanceThreshold = {
  value: number;
  unit: "ms" | "percent" | "mb" | "seconds";
  description?: string;
};

export interface PerformanceMonitoring {
  enabled: boolean;
  interval: number;
  intervalSeconds?: number;
  retention_days: number;
  metrics?: string[];
}

export interface PerformanceAlert {
  enabled?: boolean;
  channels?: string[];
  cooldown_minutes?: number;
  metric?: string;
  threshold?: number;
  action?: string;
  recipients?: string[];
}

export interface PerformanceConfig {
  id: string;
  category: PerformanceCategory;
  name: string;
  value: unknown;
  isActive: boolean;
  settings?: Record<string, string | number | boolean>;
  thresholds?: Record<string, PerformanceThreshold>;
  monitoring?: PerformanceMonitoring;
  alerts?: PerformanceAlert[];
  createdAt?: string;
  updatedAt?: string;
}

export type PerformanceCategory =
  | "cache"
  | "database"
  | "network"
  | "ui"
  | "caching"
  | "file_upload"
  | "api"
  | "monitoring";

export interface CreatePerformanceConfigDTO {
  category: PerformanceCategory;
  name: string;
  value: unknown;
  isActive: boolean;
  settings?: Record<string, string | number | boolean>;
  thresholds?: Record<string, PerformanceThreshold>;
  monitoring?: PerformanceMonitoring;
  alerts?: PerformanceAlert[];
}
