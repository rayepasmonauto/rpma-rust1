import { useState, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { CalendarTask, ConflictDetection } from "@/lib/backend";
import { calendarKeys } from "@/lib/query-keys";
import { useAuth } from "@/shared/hooks/useAuth";
import {
  getCalendarTasks,
  checkCalendarConflicts,
  scheduleTask,
  createCalendarFilter,
} from "../ipc/calendar";

export type CalendarViewMode = "month" | "week" | "day" | "agenda";

export interface CalendarState {
  tasks: CalendarTask[];
  isLoading: boolean;
  error: string | null;
  currentDate: Date;
  viewMode: CalendarViewMode;
  filters: {
    technicianIds?: string[];
    statuses?: string[];
    priorities?: string[];
  };
}

export interface UseCalendarReturn extends CalendarState {
  setCurrentDate: (date: Date) => void;
  setViewMode: (mode: CalendarViewMode) => void;
  setFilters: (filters: CalendarState["filters"]) => void;
  refreshTasks: () => Promise<void>;
  checkConflicts: (
    taskId: string,
    newDate: string,
    newStart?: string,
    newEnd?: string,
  ) => Promise<ConflictDetection>;
  rescheduleTaskWithConflictCheck: (
    taskId: string,
    newDate: string,
    newStart?: string,
    newEnd?: string,
    reason?: string,
  ) => Promise<{ success: boolean; error?: string }>;
}

export function useCalendar(
  initialDate?: Date,
  initialViewMode?: CalendarViewMode,
): UseCalendarReturn {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // ── UI-only state (ADR-014: local state stays in useState) ──────────────
  const [currentDate, setCurrentDate] = useState<Date>(
    initialDate || new Date(),
  );
  const [viewMode, setViewMode] = useState<CalendarViewMode>(
    initialViewMode || "month",
  );
  const [filters, setFilters] = useState<CalendarState["filters"]>({});

  // ── Derived date range & filter (pure computation) ──────────────────────
  const getDateRangeForView = useCallback(
    (date: Date, vm: CalendarViewMode): { start: string; end: string } => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();

      switch (vm) {
        case "month": {
          const start = new Date(year, month, 1);
          const end = new Date(year, month + 1, 0);
          return {
            start: start.toISOString().split("T")[0] ?? "",
            end: end.toISOString().split("T")[0] ?? "",
          };
        }
        case "week": {
          const startOfWeek = new Date(date);
          startOfWeek.setDate(date.getDate() - date.getDay());
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          return {
            start: startOfWeek.toISOString().split("T")[0] ?? "",
            end: endOfWeek.toISOString().split("T")[0] ?? "",
          };
        }
        case "day": {
          const start = new Date(year, month, day);
          const end = new Date(year, month, day);
          return {
            start: start.toISOString().split("T")[0] ?? "",
            end: end.toISOString().split("T")[0] ?? "",
          };
        }
        case "agenda": {
          const start = new Date(date);
          const end = new Date(date);
          end.setDate(date.getDate() + 30);
          return {
            start: start.toISOString().split("T")[0] ?? "",
            end: end.toISOString().split("T")[0] ?? "",
          };
        }
        default:
          return {
            start: date.toISOString().split("T")[0] ?? "",
            end: date.toISOString().split("T")[0] ?? "",
          };
      }
    },
    [],
  );

  const dateRange = useMemo(() => {
    return getDateRangeForView(currentDate, viewMode);
  }, [currentDate, viewMode, getDateRangeForView]);

  const calendarFilter = useMemo(() => {
    return createCalendarFilter(
      dateRange.start,
      dateRange.end,
      filters.technicianIds,
      filters.statuses,
    );
  }, [dateRange, filters.technicianIds, filters.statuses]);

  // ── Server state via TanStack Query (ADR-014) ──────────────────────────
  const tasksQuery = useQuery<CalendarTask[]>({
    queryKey: calendarKeys.events(calendarFilter),
    queryFn: () => getCalendarTasks(calendarFilter),
    enabled: !!user?.token,
  });

  // ── Actions ─────────────────────────────────────────────────────────────
  const refreshTasks = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: calendarKeys.events(calendarFilter),
    });
  }, [queryClient, calendarFilter]);

  const checkConflicts = useCallback(
    async (
      taskId: string,
      newDate: string,
      newStart?: string,
      newEnd?: string,
    ): Promise<ConflictDetection> => {
      if (!user?.token) {
        return {
          has_conflict: false,
          conflict_type: null,
          conflicting_tasks: [],
          message: "Authentication required to check conflicts",
        };
      }
      return await checkCalendarConflicts(taskId, newDate, newStart, newEnd);
    },
    [user?.token],
  );

  const rescheduleTaskWithConflictCheck = useCallback(
    async (
      taskId: string,
      newDate: string,
      newStart?: string,
      newEnd?: string,
      _reason?: string,
    ): Promise<{
      success: boolean;
      error?: string;
      conflicting_tasks?: CalendarTask[];
    }> => {
      try {
        if (!user?.token) {
          return {
            success: false,
            error: "Authentication required to reschedule task",
          };
        }

        // Use atomic schedule_task command that checks conflicts
        // and updates both task + calendar_events in a single transaction
        const result = await scheduleTask(taskId, newDate, newStart, newEnd);

        if (result.has_conflict) {
          return {
            success: false,
            error: result.message || "Scheduling conflict detected",
            conflicting_tasks: result.conflicting_tasks,
          };
        }

        // Refresh tasks after successful rescheduling
        await refreshTasks();

        return { success: true };
      } catch (error) {
        console.error("Failed to reschedule task:", error);
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to reschedule task",
        };
      }
    },
    [refreshTasks, user?.token],
  );

  // ── Compose return value matching CalendarState + actions ───────────────
  return {
    tasks: tasksQuery.data ?? [],
    isLoading: tasksQuery.isLoading,
    error: !user?.token
      ? "Authentication required to load calendar tasks"
      : tasksQuery.error instanceof Error
        ? tasksQuery.error.message
        : tasksQuery.error
          ? "Failed to load calendar tasks"
          : null,
    currentDate,
    viewMode,
    filters,
    setCurrentDate,
    setViewMode,
    setFilters,
    refreshTasks,
    checkConflicts,
    rescheduleTaskWithConflictCheck,
  };
}
