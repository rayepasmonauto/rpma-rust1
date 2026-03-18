import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationPanel } from '../components/NotificationPanel';
import { useNotificationStore } from '../stores/notificationStore';
import { useNotifications } from '../hooks/useNotifications';

// Mock the hook
jest.mock('../hooks/useNotifications');

jest.mock('@/lib/ipc/notification', () => ({
  notificationApi: {
    get: jest.fn(),
    markRead: jest.fn(),
    markAllRead: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock useRouter
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('NotificationPanel', () => {
  const mockNotifications: any[] = [
    {
      id: '1',
      type: 'TaskAssignment',
      title: 'New Task',
      message: 'You have been assigned to a new task',
      entity_type: 'task',
      entity_id: 'task-1',
      entity_url: '/tasks/task-1',
      read: false,
      user_id: 'user-1',
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      type: 'InterventionCreated',
      title: 'Intervention Started',
      message: 'An intervention has been started',
      entity_type: 'intervention',
      entity_id: 'intervention-1',
      entity_url: '/interventions/intervention-1',
      read: true,
      user_id: 'user-1',
      created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    },
  ];

  const mockMarkRead = jest.fn();
  const mockMarkAllRead = jest.fn();
  const mockRemoveNotification = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useNotificationStore.setState({
      isConnected: true,
      isPanelOpen: false,
    });

    (useNotifications as jest.Mock).mockReturnValue({
      notifications: mockNotifications,
      unreadCount: 1,
      isLoading: false,
      markRead: mockMarkRead,
      markAllRead: mockMarkAllRead,
      removeNotification: mockRemoveNotification,
    });
  });

  it('should not render when panel is closed', () => {
    render(<NotificationPanel />);
    
    const panel = screen.queryByRole('dialog');
    expect(panel).not.toBeInTheDocument();
  });

  it('should render when panel is open', () => {
    useNotificationStore.setState({ isPanelOpen: true });
    render(<NotificationPanel />);
    
    const panel = screen.getByRole('dialog');
    expect(panel).toBeInTheDocument();
  });

  it('should display notifications', () => {
    useNotificationStore.setState({ isPanelOpen: true });
    render(<NotificationPanel />);
    
    const taskNotification = screen.getByText('New Task');
    const interventionNotification = screen.getByText('Intervention Started');
    expect(taskNotification).toBeInTheDocument();
    expect(interventionNotification).toBeInTheDocument();
  });

  it('should show empty state when no notifications', () => {
    (useNotifications as jest.Mock).mockReturnValue({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      markRead: mockMarkRead,
      markAllRead: mockMarkAllRead,
      removeNotification: mockRemoveNotification,
    });
    useNotificationStore.setState({ isPanelOpen: true });
    
    render(<NotificationPanel />);
    
    const emptyState = screen.getByText(/Aucune notification/i);
    expect(emptyState).toBeInTheDocument();
  });

  it('should mark notification as read on click', async () => {
    const user = userEvent.setup();
    useNotificationStore.setState({ isPanelOpen: true });
    
    render(<NotificationPanel />);
    
    const firstNotification = screen.getByText('New Task');
    await user.click(firstNotification);
    
    expect(mockMarkRead).toHaveBeenCalledWith('1');
  });

  it('should show "Mark all as read" button when there are unread', () => {
    useNotificationStore.setState({ isPanelOpen: true });
    render(<NotificationPanel />);
    
    const button = screen.getByText(/Tout marquer comme lu/i);
    expect(button).toBeInTheDocument();
  });

  it('should not show "Mark all as read" button when all are read', () => {
    (useNotifications as jest.Mock).mockReturnValue({
      notifications: mockNotifications.map(n => ({ ...n, read: true })),
      unreadCount: 0,
      isLoading: false,
      markRead: mockMarkRead,
      markAllRead: mockMarkAllRead,
      removeNotification: mockRemoveNotification,
    });
    useNotificationStore.setState({ isPanelOpen: true });
    
    render(<NotificationPanel />);
    
    const button = screen.queryByText(/Tout marquer comme lu/i);
    expect(button).not.toBeInTheDocument();
  });
});
