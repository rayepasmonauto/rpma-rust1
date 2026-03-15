import { useMutation } from '@tanstack/react-query';
import { useIpcClient } from '@/lib/ipc/client';

export const sendTestNotification = async (_email: string, _token: string): Promise<void> => {
  throw new Error('External notification channels are not available');
};

export const useNotificationSettings = () => {
  const _ipcClient = useIpcClient();

  const testMutation = useMutation({
    mutationFn: async ({ email, token }: { email: string; token: string }) => {
      return sendTestNotification(email, token);
    },
  });

  return {
    testNotification: testMutation,
  };
};
