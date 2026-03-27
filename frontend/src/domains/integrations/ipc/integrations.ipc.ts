import { safeInvoke } from "@/lib/ipc/core";
import { IPC_COMMANDS } from "@/lib/ipc/commands";
import type { JsonObject } from "@/types/json";
import type {
  BackendIntegrationConfig,
  CreateBackendIntegrationRequest,
  TestBackendIntegrationResponse,
  UpdateBackendIntegrationRequest,
} from "@/shared/types";

export const integrationsIpc = {
  list: () =>
    safeInvoke<BackendIntegrationConfig[]>(IPC_COMMANDS.INTEGRATION_LIST, {}),

  get: (id: string) =>
    safeInvoke<BackendIntegrationConfig>(IPC_COMMANDS.INTEGRATION_GET, { id }),

  create: (request: CreateBackendIntegrationRequest) =>
    safeInvoke<BackendIntegrationConfig>(IPC_COMMANDS.INTEGRATION_CREATE, {
      request: request as unknown as JsonObject,
    }),

  update: (id: string, request: UpdateBackendIntegrationRequest) =>
    safeInvoke<BackendIntegrationConfig>(IPC_COMMANDS.INTEGRATION_UPDATE, {
      id,
      request: request as unknown as JsonObject,
    }),

  test: (id: string) =>
    safeInvoke<TestBackendIntegrationResponse>(IPC_COMMANDS.INTEGRATION_TEST, {
      id,
    }),

  delete: (id: string) =>
    safeInvoke<BackendIntegrationConfig>(IPC_COMMANDS.INTEGRATION_DELETE, { id }),

  retryDeadLetters: (id: string) =>
    safeInvoke<number>(IPC_COMMANDS.INTEGRATION_RETRY_DEAD_LETTER, { id }),
} as const;
