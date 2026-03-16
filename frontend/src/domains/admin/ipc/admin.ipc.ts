import { safeInvoke } from '@/lib/ipc/core';
import { IPC_COMMANDS } from '@/lib/ipc/commands';
import type { JsonValue } from '@/types/json';

export const adminIpc = {
  healthCheck: () =>
    safeInvoke<string>(IPC_COMMANDS.HEALTH_CHECK),

  getHealthStatus: () =>
    safeInvoke<JsonValue>(IPC_COMMANDS.HEALTH_CHECK),

  getDatabaseStatus: () =>
    safeInvoke<JsonValue>(IPC_COMMANDS.DIAGNOSE_DATABASE, {}),

  getDatabaseStats: () =>
    safeInvoke<JsonValue>(IPC_COMMANDS.GET_DATABASE_STATS, {}),

  getDatabasePoolHealth: () =>
    safeInvoke<JsonValue>(IPC_COMMANDS.GET_DATABASE_POOL_HEALTH, {}),

  getAppInfo: () =>
    safeInvoke<JsonValue>(IPC_COMMANDS.GET_APP_INFO),

  getDeviceInfo: () =>
    safeInvoke<JsonValue>(IPC_COMMANDS.GET_DEVICE_INFO),
};
