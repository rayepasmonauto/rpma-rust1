"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminKeys } from "@/lib/query-keys";
import {
  type AppSettings,
  type GeneralSettings,
  type NotificationSettings,
  type SecuritySettings,
} from "@/lib/backend/settings";
import { settingsOperations } from "@/shared/utils";
import { useAuth } from "@/shared/hooks/useAuth";
import type { BusinessHoursConfig } from "@/types/configuration.types";
import type { JsonObject } from "@/types/json";

const DEFAULT_BUSINESS_HOURS: BusinessHoursConfig = {
  enabled: true,
  timezone: "Europe/Paris",
  schedule: {
    monday: { start: "08:00", end: "18:00", enabled: true },
    tuesday: { start: "08:00", end: "18:00", enabled: true },
    wednesday: { start: "08:00", end: "18:00", enabled: true },
    thursday: { start: "08:00", end: "18:00", enabled: true },
    friday: { start: "08:00", end: "18:00", enabled: true },
    saturday: { start: "09:00", end: "13:00", enabled: false },
    sunday: { start: "00:00", end: "00:00", enabled: false },
  },
};

function getBusinessHours(value: AppSettings["business_hours"]): BusinessHoursConfig {
  if (
    value &&
    typeof value === "object" &&
    "schedule" in value &&
    typeof value.schedule === "object"
  ) {
    return value as unknown as BusinessHoursConfig;
  }

  return DEFAULT_BUSINESS_HOURS;
}

export function useAdminAppSettings() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<AppSettings | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: adminKeys.appSettings(),
    queryFn: () => settingsOperations.getAppSettings() as Promise<AppSettings>,
    enabled: !!session?.token,
    staleTime: 60_000,
  });

  const settings = draft ?? data ?? null;
  const businessHours = useMemo(
    () => getBusinessHours(settings?.business_hours ?? {}),
    [settings],
  );

  const saveMutation = useMutation({
    mutationFn: async (next: AppSettings) => {
      await settingsOperations.updateGeneralSettings(next.general);
      await settingsOperations.updateSecuritySettings(next.security);
      await settingsOperations.updateNotificationSettings(next.notifications);
      await settingsOperations.updateBusinessHours(next.business_hours as JsonObject);
    },
    onSuccess: async () => {
      toast.success("Paramètres applicatifs mis à jour");
      setDraft(null);
      await queryClient.invalidateQueries({ queryKey: adminKeys.appSettings() });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Échec de la sauvegarde des paramètres applicatifs",
      );
    },
  });

  const updateSection = <
    K extends "general" | "security" | "notifications",
    T extends AppSettings[K],
  >(
    section: K,
    updater: (current: T) => T,
  ) => {
    setDraft((prev) => {
      const base = prev ?? data;
      if (!base) return prev;
      return {
        ...base,
        [section]: updater(base[section] as T),
      };
    });
  };

  const setBusinessHours: Dispatch<SetStateAction<BusinessHoursConfig>> = (update) => {
    setDraft((prev) => {
      const base = prev ?? data;
      if (!base) return prev;
      const current = getBusinessHours(base.business_hours);
      const next = typeof update === "function" ? update(current) : update;
      return {
        ...base,
        business_hours: next as unknown as Record<string, unknown>,
      };
    });
  };

  return {
    settings,
    businessHours,
    isLoading,
    isSaving: saveMutation.isPending,
    hasChanges: !!draft,
    save: async () => {
      const next = draft ?? data;
      if (!next) return;
      await saveMutation.mutateAsync(next);
    },
    reset: () => setDraft(null),
    updateGeneral: (updater: (current: GeneralSettings) => GeneralSettings) =>
      updateSection("general", updater),
    updateSecurity: (updater: (current: SecuritySettings) => SecuritySettings) =>
      updateSection("security", updater),
    updateNotifications: (
      updater: (current: NotificationSettings) => NotificationSettings,
    ) => updateSection("notifications", updater),
    setBusinessHours,
  };
}
