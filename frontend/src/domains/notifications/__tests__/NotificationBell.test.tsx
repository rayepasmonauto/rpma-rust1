import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationBell } from '../components/NotificationBell';
import { useNotificationStore } from '../stores/notificationStore';
import { useNotifications } from '../hooks/useNotifications';

jest.mock('../hooks/useNotifications');

jest.mock('@/lib/ipc/notification', () => ({
  notificationApi: {
    get: jest.fn(),
    markRead: jest.fn(),
    markAllRead: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('NotificationBell', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useNotificationStore.setState({
      isConnected: false,
      isPanelOpen: false,
    });

    (useNotifications as jest.Mock).mockReturnValue({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      markRead: jest.fn(),
      markAllRead: jest.fn(),
      removeNotification: jest.fn(),
    });
  });

  it('should render bell icon', () => {
    render(<NotificationBell />);
    
    const bell = screen.getByRole('button');
    expect(bell).toBeInTheDocument();
  });

  it('should not show badge when no unread notifications', () => {
    render(<NotificationBell />);
    
    const badge = screen.queryByText('0');
    expect(badge).not.toBeInTheDocument();
  });

  it('should show badge with unread count', () => {
    (useNotifications as jest.Mock).mockReturnValue({
      notifications: [],
      unreadCount: 5,
      isLoading: false,
      markRead: jest.fn(),
      markAllRead: jest.fn(),
      removeNotification: jest.fn(),
    });

    render(<NotificationBell />);
    
    const badge = screen.getByText('5');
    expect(badge).toBeInTheDocument();
  });

  it('should show badge with 99+ for high counts', () => {
    (useNotifications as jest.Mock).mockReturnValue({
      notifications: [],
      unreadCount: 100,
      isLoading: false,
      markRead: jest.fn(),
      markAllRead: jest.fn(),
      removeNotification: jest.fn(),
    });

    render(<NotificationBell />);
    
    const badge = screen.getByText('99+');
    expect(badge).toBeInTheDocument();
  });

  it('should open panel on click', async () => {
    const user = userEvent.setup();
    render(<NotificationBell />);
    
    const bell = screen.getByRole('button');
    await user.click(bell);

    const state = useNotificationStore.getState();
    expect(state.isPanelOpen).toBe(true);
  });
});
