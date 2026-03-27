import { safeInvoke } from "@/lib/ipc/core";
import { IPC_COMMANDS } from "@/lib/ipc/commands";
import type { JsonObject } from "@/types/json";
import type {
  BackendRuleDefinition,
  BackendRuleEvaluationResult,
  CreateBackendRuleRequest,
  TestBackendRuleRequest,
  UpdateBackendRuleRequest,
} from "@/shared/types";

export const rulesIpc = {
  list: () =>
    safeInvoke<BackendRuleDefinition[]>(IPC_COMMANDS.RULE_LIST, {}),

  get: (id: string) =>
    safeInvoke<BackendRuleDefinition>(IPC_COMMANDS.RULE_GET, { id }),

  create: (request: CreateBackendRuleRequest) =>
    safeInvoke<BackendRuleDefinition>(IPC_COMMANDS.RULE_CREATE, {
      request: request as unknown as JsonObject,
    }),

  update: (id: string, request: UpdateBackendRuleRequest) =>
    safeInvoke<BackendRuleDefinition>(IPC_COMMANDS.RULE_UPDATE, {
      id,
      request: request as unknown as JsonObject,
    }),

  activate: (id: string) =>
    safeInvoke<BackendRuleDefinition>(IPC_COMMANDS.RULE_ACTIVATE, { id }),

  disable: (id: string) =>
    safeInvoke<BackendRuleDefinition>(IPC_COMMANDS.RULE_DISABLE, { id }),

  delete: (id: string) =>
    safeInvoke<BackendRuleDefinition>(IPC_COMMANDS.RULE_DELETE, { id }),

  test: (request: TestBackendRuleRequest) =>
    safeInvoke<BackendRuleEvaluationResult>(IPC_COMMANDS.RULE_TEST, {
      request: request as unknown as JsonObject,
    }),
} as const;
