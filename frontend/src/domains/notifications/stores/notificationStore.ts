import { create } from 'zustand';

interface NotificationState {
  isConnected: boolean;
  isPanelOpen: boolean;
  setConnected: (connected: boolean) => void;
  setPanelOpen: (open: boolean) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  isConnected: false,
  isPanelOpen: false,
  setConnected: (isConnected) => set({ isConnected }),
  setPanelOpen: (isPanelOpen) => set({ isPanelOpen }),
}));