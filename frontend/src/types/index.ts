// Common TypeScript interfaces for RPMA v2

// Re-export specialized types
export * from './auth.types';
export * from './task.types';

// Import and re-export extended types from lib/types.ts
import type { UserAccount, Task, Client, ClientWithTasks } from '@/lib/types';
export type { UserAccount, Task, Client, ClientWithTasks };

// Import core backend types for re-export
import type {
  Intervention,
  SyncOperation,
  SyncStatus,
  Photo,
  PhotoType,
  PhotoCategory,
  TaskStatistics,
  TaskListResponse,
  ClientListResponse,
  UserListResponse,
  UserResponse,
} from '@/lib/backend';

// Re-export core backend types for backward compatibility
export type {
  Intervention,
  SyncOperation,
  SyncStatus,
  Photo,
  PhotoType,
  PhotoCategory,
  TaskStatistics,
  TaskListResponse,
  ClientListResponse,
  UserListResponse,
  UserResponse,
};



// Tauri invoke function type
export interface TauriInvoke {
  <T>(command: string, args?: Record<string, unknown>): Promise<T>;
}

// Legacy response types (keeping for backward compatibility)

// Menu event interface
export interface MenuEvent {
  event: string;
  payload?: Record<string, unknown>;
}

// Form data interface
export interface FormData {
  [key: string]: unknown;
}

// Table column interface
export interface TableColumn<T = Record<string, unknown>> {
  key: string;
  title: string;
  width?: number | string;
  render?: (value: unknown, item: T) => React.ReactNode;
}

// API response interface
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Auth interfaces are now defined in auth.types.ts

// Task CRUD response types (not yet generated from Rust — kept for compatibility)
export type TaskResponse =
  | { type: 'Created'; data: Task }
  | { type: 'Found'; data: Task }
  | { type: 'Updated'; data: Task }
  | { type: 'Deleted' }
  | { type: 'NotFound' }
  | { type: 'List'; data: TaskListResponse }
  | { type: 'Statistics'; data: TaskStatistics };

// Client CRUD response types (not yet generated from Rust — kept for compatibility)
export type ClientResponse =
  | { type: 'Created'; data: Client }
  | { type: 'Found'; data: Client }
  | { type: 'Updated'; data: Client }
  | { type: 'Deleted' }
  | { type: 'NotFound' }
  | { type: 'List'; data: ClientListResponse }
  | { type: 'SearchResults'; data: Client[] };