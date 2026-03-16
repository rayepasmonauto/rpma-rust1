import { safeInvoke, cachedInvoke, invalidatePattern } from '@/lib/ipc/core';
import { IPC_COMMANDS } from '@/lib/ipc/commands';
import type { UserSettings } from '@/lib/backend';
import type { JsonObject, JsonValue } from '@/types/json';

const invalidateUserSettingsCache = (): void => {
  invalidatePattern('user-settings');
};

export const settingsIpc = {
  getAppSettings: () =>
    safeInvoke<JsonValue>(IPC_COMMANDS.GET_APP_SETTINGS, {}),

  updateNotificationSettings: async (request: JsonObject) => {
    return safeInvoke<JsonValue>(IPC_COMMANDS.UPDATE_NOTIFICATION_SETTINGS, { request });
  },

  // User settings operations
  getUserSettings: () =>
    cachedInvoke<UserSettings>('user-settings', IPC_COMMANDS.GET_USER_SETTINGS, {}, undefined, 30000),

  updateUserProfile: async (request: JsonObject) => {
    const result = await safeInvoke<JsonValue>(IPC_COMMANDS.UPDATE_USER_PROFILE, { request });
    invalidateUserSettingsCache();
    return result;
  },

  updateUserPreferences: async (request: JsonObject) => {
    const result = await safeInvoke<JsonValue>(IPC_COMMANDS.UPDATE_USER_PREFERENCES, { request });
    invalidateUserSettingsCache();
    return result;
  },

  updateUserSecurity: async (request: JsonObject) => {
    const result = await safeInvoke<JsonValue>(IPC_COMMANDS.UPDATE_USER_SECURITY, { request });
    invalidateUserSettingsCache();
    return result;
  },

  updateUserPerformance: async (request: JsonObject) => {
    const result = await safeInvoke<JsonValue>(IPC_COMMANDS.UPDATE_USER_PERFORMANCE, { request });
    invalidateUserSettingsCache();
    return result;
  },

  updateUserAccessibility: async (request: JsonObject) => {
    const result = await safeInvoke<JsonValue>(IPC_COMMANDS.UPDATE_USER_ACCESSIBILITY, { request });
    invalidateUserSettingsCache();
    return result;
  },

  updateUserNotifications: async (request: JsonObject) => {
    const result = await safeInvoke<JsonValue>(IPC_COMMANDS.UPDATE_USER_NOTIFICATIONS, { request });
    invalidateUserSettingsCache();
    return result;
  },

  updateGeneralSettings: async (request: JsonObject): Promise<JsonValue> => {
    const result = await safeInvoke<JsonValue>(IPC_COMMANDS.UPDATE_GENERAL_SETTINGS, {
      request
    });
    return result;
  },

  updateBusinessRules: async (rules: JsonValue[]): Promise<JsonValue> => {
    return safeInvoke<JsonValue>(IPC_COMMANDS.UPDATE_BUSINESS_RULES, {
      request: { rules }
    });
  },

  updateSecurityPolicies: async (policies: JsonValue[]): Promise<JsonValue> => {
    return safeInvoke<JsonValue>(IPC_COMMANDS.UPDATE_SECURITY_POLICIES, {
      request: { policies }
    });
  },

  updateIntegrations: async (integrations: JsonValue[]): Promise<JsonValue> => {
    return safeInvoke<JsonValue>(IPC_COMMANDS.UPDATE_INTEGRATIONS, {
      request: { integrations }
    });
  },

  updatePerformanceConfigs: async (configs: JsonValue[]): Promise<JsonValue> => {
    return safeInvoke<JsonValue>(IPC_COMMANDS.UPDATE_PERFORMANCE_CONFIGS, {
      request: { configs }
    });
  },

  updateBusinessHours: async (hours: JsonObject): Promise<JsonValue> => {
    return safeInvoke<JsonValue>(IPC_COMMANDS.UPDATE_BUSINESS_HOURS, {
      request: { hours }
    });
  },

  changeUserPassword: async (request: JsonObject) => {
    const result = await safeInvoke<string>(IPC_COMMANDS.CHANGE_USER_PASSWORD, { request });
    invalidateUserSettingsCache();
    return result;
  },

  // Security operations
  getActiveSessions: () =>
    safeInvoke<JsonValue>(IPC_COMMANDS.GET_ACTIVE_SESSIONS, {}),

  revokeSession: (sessionId: string) =>
    safeInvoke<void>(IPC_COMMANDS.REVOKE_SESSION, { session_id: sessionId }),

  revokeAllSessionsExceptCurrent: () =>
    safeInvoke<void>(IPC_COMMANDS.REVOKE_ALL_SESSIONS_EXCEPT_CURRENT, {}),

  updateSessionTimeout: (timeoutMinutes: number) =>
    safeInvoke<void>(IPC_COMMANDS.UPDATE_SESSION_TIMEOUT, { timeout_minutes: timeoutMinutes }),

  getSessionTimeoutConfig: () =>
    safeInvoke<JsonValue>(IPC_COMMANDS.GET_SESSION_TIMEOUT_CONFIG, {}),

  uploadUserAvatar: (fileData: string, fileName: string, mimeType: string) =>
    safeInvoke<string>(IPC_COMMANDS.UPLOAD_USER_AVATAR, {
      request: { avatar_data: fileData, mime_type: mimeType }
    }).then((result) => {
      invalidateUserSettingsCache();
      return result;
    }),

  exportUserData: () =>
    safeInvoke<JsonObject>(IPC_COMMANDS.EXPORT_USER_DATA, {}),

  deleteUserAccount: async (confirmation: string) => {
    const result = await safeInvoke<string>(IPC_COMMANDS.DELETE_USER_ACCOUNT, {
      request: { confirmation }
    });
    invalidateUserSettingsCache();
    return result;
  },

  getDataConsent: () =>
    safeInvoke<JsonObject>(IPC_COMMANDS.GET_DATA_CONSENT, {}),

  updateDataConsent: (request: JsonObject) =>
    safeInvoke<JsonObject>(IPC_COMMANDS.UPDATE_DATA_CONSENT, {
      request
    }),
};
