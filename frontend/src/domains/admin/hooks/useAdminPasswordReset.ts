import { useCallback, useState } from "react";
// ❌ CROSS-DOMAIN IMPORT — TODO(ADR-002): Move to shared/ or use public index
import { userIpc } from "@/domains/users/ipc/users.ipc";

export function useAdminPasswordReset() {
  const [isResetting, setIsResetting] = useState(false);

  const resetPassword = useCallback(async (userId: string) => {
    setIsResetting(true);
    try {
      return await userIpc.adminResetPassword(userId);
    } finally {
      setIsResetting(false);
    }
  }, []);

  return {
    isResetting,
    resetPassword,
  };
}
