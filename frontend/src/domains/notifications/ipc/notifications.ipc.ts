import { safeInvoke } from '@/lib/ipc/core';
import { IPC_COMMANDS } from '@/lib/ipc/commands';
import type { SendNotificationRequest } from '@/lib/backend';
import type { JsonValue } from '@/types/json';

interface NotificationConfig {
  provider?: string;
  api_key?: string;
  sender_email?: string;
  sender_phone?: string;
  enabled_channels?: string[];
  [key: string]: JsonValue | undefined;
}

export const notificationsIpc = {
  initialize: (config: NotificationConfig) =>
    safeInvoke<void>(IPC_COMMANDS.INITIALIZE_NOTIFICATION_SERVICE, { config }),

  send: (request: SendNotificationRequest) =>
    safeInvoke<void>(IPC_COMMANDS.SEND_NOTIFICATION, { request }),

  getStatus: () =>
    safeInvoke<JsonValue>(IPC_COMMANDS.GET_NOTIFICATION_STATUS, {}),

  // Recent activities for admin dashboard
  getRecentActivities: () =>
    safeInvoke<JsonValue[]>(IPC_COMMANDS.GET_RECENT_ACTIVITIES, {}),
};
