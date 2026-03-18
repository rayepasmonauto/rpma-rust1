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

describe('PreferencesTab payload shape', () => {
  const user = {
    user_id: 'u1',
    token: 'token-1',
  } as UserSession;

  beforeEach(() => {
    (useSettings as jest.Mock).mockReturnValue({
      settings: {
        preferences: {
          language: 'fr',
          theme: 'system',
        },
        notifications: {},
        accessibility: {},
      },
      loading: false,
      error: null,
    });
  });

  it('renders the preferences placeholder', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <PreferencesTab user={user} />
      </QueryClientProvider>
    );
    expect(screen.getByText(/Affichage & Langue/i)).toBeInTheDocument();
  });
});
