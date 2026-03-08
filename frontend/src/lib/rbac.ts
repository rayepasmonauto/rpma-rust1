import type { UserAccount } from '@/lib/backend';

const allPermissions = [
  'task:read',
  'task:write',
  'task:update',
  'task:delete',
  'client:read',
  'client:write',
  'client:update',
  'client:delete',
  'report:read',
  'report:write',
  'settings:read',
  'settings:write',
  'user:read',
  'user:write',
  'user:update',
  'user:delete',
  'inventory:read',
  'inventory:write',
  'calendar:read',
  'calendar:write',
  'photo:upload',
  'photo:delete',
] as const;

/**
 * Type for user roles
 */
export type UserRole = 'admin' | 'supervisor' | 'technician' | 'viewer';

/**
 * Type for permissions
 */
export type Permission = typeof allPermissions[number];

/**
 * Role-to-permissions matrix.
 * Enforced on the frontend as defense-in-depth;
 * the Rust backend is the authoritative RBAC enforcement point.
 */
const rolePermissions: Record<UserRole, readonly Permission[]> = {
  admin: allPermissions,
  supervisor: [
    'task:read', 'task:write', 'task:update',
    'client:read', 'client:write', 'client:update',
    'report:read', 'report:write',
    'inventory:read', 'inventory:write',
    'calendar:read', 'calendar:write',
    'photo:upload', 'photo:delete',
    'user:read',
  ],
  technician: [
    'task:read', 'task:write', 'task:update',
    'client:read',
    'inventory:read',
    'calendar:read',
    'photo:upload',
  ],
  viewer: [
    'task:read',
    'client:read',
    'report:read',
    'inventory:read',
    'calendar:read',
  ],
} as const;

/**
 * Check if a user role has a specific permission.
 */
export const hasPermission = (role: UserRole, permission: Permission): boolean => {
  return (rolePermissions[role] as readonly string[]).includes(permission);
};

/**
 * Check if a user role has any of the specified permissions.
 */
export const hasAnyPermission = (
  role: UserRole,
  permissions: Permission[]
): boolean => {
  return permissions.some(permission => hasPermission(role, permission));
};

/**
 * Check if a user role has all of the specified permissions.
 */
export const hasAllPermissions = (
  role: UserRole,
  permissions: Permission[]
): boolean => {
  return permissions.every(permission => hasPermission(role, permission));
};

/**
 * Get all permissions granted to a role.
 */
export const getRolePermissions = (role: UserRole): Permission[] => {
  return [...rolePermissions[role]];
};

/**
 * Create a permission checker function for a specific user
 * @param user - User account object
 * @returns Permission checker function
 */
export const createPermissionChecker = (user: UserAccount | null) => {
  const userRole = user?.role as UserRole || 'viewer';
  
  return {
    can: (permission: Permission) => hasPermission(userRole, permission),
    canAny: (permissions: Permission[]) => hasAnyPermission(userRole, permissions),
    canAll: (permissions: Permission[]) => hasAllPermissions(userRole, permissions),
    role: userRole,
  };
};

/**
 * Middleware function to check permissions before executing an action
 * @param user - User account
 * @param requiredPermission - Required permission
 * @param action - Action to execute if authorized
 * @returns Result of the action or error
 */
export const withPermissionCheck = async <T>(
  user: UserAccount | null,
  requiredPermission: Permission,
  action: () => Promise<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> => {
  const userRole = user?.role as UserRole || 'viewer';
  
  if (!hasPermission(userRole, requiredPermission)) {
    return {
      success: false,
      error: `Insufficient permissions. Required: ${requiredPermission}, Role: ${userRole}`,
    };
  }
  
  try {
    const data = await action();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

/**
 * Permission groups for common checks
 */
export const permissionGroups = {
  taskManagement: ['task:read', 'task:write', 'task:update', 'task:delete'],
  clientManagement: ['client:read', 'client:write', 'client:update', 'client:delete'],
  reporting: ['report:read', 'report:write'],
  userManagement: ['user:read', 'user:write', 'user:update', 'user:delete'],
  settings: ['settings:read', 'settings:write'],
  inventory: ['inventory:read', 'inventory:write'],
  photoManagement: ['photo:upload', 'photo:delete'],
} as const;
