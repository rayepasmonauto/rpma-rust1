import { describe, it, expect, beforeEach } from '@jest/globals';
import { useNotificationStore } from '../stores/notificationStore';

describe('notificationStore', () => {
  beforeEach(() => {
    useNotificationStore.setState({
      isConnected: false,
      isPanelOpen: false,
    });
  });

  it('should initialize with empty state', () => {
    const state = useNotificationStore.getState();
    expect(state.isConnected).toBe(false);
    expect(state.isPanelOpen).toBe(false);
  });

  it('should set connected state', () => {
    useNotificationStore.getState().setConnected(true);

    const state = useNotificationStore.getState();
    expect(state.isConnected).toBe(true);
  });

  it('should set panel open state', () => {
    useNotificationStore.getState().setPanelOpen(true);

    const state = useNotificationStore.getState();
    expect(state.isPanelOpen).toBe(true);
  });
});
