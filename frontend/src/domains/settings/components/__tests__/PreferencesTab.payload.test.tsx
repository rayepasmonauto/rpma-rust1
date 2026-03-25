import { render, screen } from '@testing-library/react';
import type { UserSession } from '@/lib/backend';
import { PreferencesTab } from '../PreferencesTab';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSettings } from '../../api/useSettings';

jest.mock('../../api/useSettings');

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('PreferencesTab notifications settings', () => {
  const user = {
    user_id: 'u1',
    token: 'token-1',
  } as UserSession;

  beforeEach(() => {
    (useSettings as jest.Mock).mockReturnValue({
      settings: {
        preferences: {
          emailNotifications: true,
          pushNotifications: true,
          taskAssignments: true,
          taskUpdates: true,
          systemAlerts: true,
          weeklyReports: false,
          language: 'fr',
          theme: 'system',
          dateFormat: 'DD/MM/YYYY',
          timeFormat: '24h',
          highContrast: false,
          largeText: false,
          reduceMotion: false,
          screenReader: false,
          autoRefresh: true,
          refreshInterval: 60,
        },
        notifications: {
          email_enabled: true,
          push_enabled: true,
          in_app_enabled: true,
          task_assigned: true,
          task_updated: true,
          task_completed: true,
          task_overdue: true,
          system_alerts: true,
          maintenance: false,
          security_alerts: true,
          quiet_hours_enabled: true,
          quiet_hours_start: '22:00',
          quiet_hours_end: '08:00',
          digest_frequency: 'never',
          batch_notifications: false,
          sound_enabled: true,
          sound_volume: 70,
        },
        accessibility: {
          high_contrast: false,
          large_text: false,
          reduce_motion: false,
          screen_reader: false,
          focus_indicators: true,
          keyboard_navigation: true,
          text_to_speech: false,
          speech_rate: 1,
          font_size: 16,
          color_blind_mode: 'none',
        },
      },
      loading: false,
      error: null,
    });
  });

  it('renders only the supported in-app notification controls', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <PreferencesTab user={user} />
      </QueryClientProvider>
    );

    expect(screen.getByText(/Activer les notifications in-app/i)).toBeInTheDocument();
    expect(screen.getByText(/Taches terminees/i)).toBeInTheDocument();
    expect(screen.getByText(/Heures silencieuses/i)).toBeInTheDocument();
    expect(screen.queryByText(/Son des notifications/i)).not.toBeInTheDocument();
  });

  it('shows quiet hours time inputs when quiet hours are enabled', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <PreferencesTab user={user} />
      </QueryClientProvider>
    );

    expect(screen.getByLabelText(/Debut/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Fin/i)).toBeInTheDocument();
  });
});
