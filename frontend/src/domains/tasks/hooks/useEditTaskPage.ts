"use client";

import { useRouter, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { taskKeys } from "@/lib/query-keys";
import { useTranslation } from "@/shared/hooks";
import { useAuth } from "@/shared/hooks/useAuth";
import { taskIpc } from "../ipc/task.ipc";
import type { TaskFormData } from "../components/TaskForm/types";
import type { Task } from "../api/types";

export function useEditTaskPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();

  const taskId = params.id as string;

  const {
    data: taskData = null,
    isLoading: loading,
    error: queryError,
  } = useQuery<Task | null>({
    queryKey: taskKeys.byId(taskId),
    queryFn: async () => {
      const task = await taskIpc.get(taskId);
      if (!task) {
        throw new Error(t("errors.taskLoadError"));
      }
      return task as Task;
    },
    enabled: !!taskId && !!user?.token,
  });

  // Derive error string from query error to preserve the original return type
  const error: string | null = queryError
    ? queryError instanceof Error
      ? queryError.message
      : t("errors.taskLoadError")
    : null;

  // Show toast on error (useQuery deduplicates so this only fires once per error)
  if (error) {
    // Toast is idempotent for the same message in sonner
    toast.error(error);
  }

  const handleSuccess = (updatedTask?: { id: string }) => {
    if (updatedTask?.id) {
      toast.success(t("tasks.taskUpdated"));
      router.push(`/tasks/${updatedTask.id}`);
    }
  };

  const handleCancel = () => {
    router.push("/tasks");
  };

  return {
    t,
    taskId,
    taskData: taskData as unknown as Partial<TaskFormData> | null,
    loading,
    error,
    handleSuccess,
    handleCancel,
  };
}
