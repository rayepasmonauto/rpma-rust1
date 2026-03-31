import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PPFWorkflowProvider, usePPFWorkflow } from '../api/PPFWorkflowProvider';
import { interventionsIpc } from '../ipc/interventions.ipc';
import { ipcClient } from '@/lib/ipc';

jest.mock('@/shared/hooks/useAuth', () => ({
  useAuth: () => ({
    session: { token: 'session-token' },
  }),
}));

jest.mock('../ipc/interventions.ipc', () => ({
  interventionsIpc: {
    getActiveByTask: jest.fn(),
    getLatestByTask: jest.fn(),
    getProgress: jest.fn(),
    advanceStep: jest.fn(),
    saveStepProgress: jest.fn(),
    finalize: jest.fn(),
  },
}));

jest.mock('@/lib/ipc', () => ({
  ipcClient: {
    tasks: {
      get: jest.fn(),
    },
  },
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const WorkflowConsumer = () => {
  const { taskId, steps, isLoading } = usePPFWorkflow();
  if (isLoading) {
    return <div>loading</div>;
  }
  return <div>{taskId}:{steps.length}</div>;
};

const WorkflowActionsConsumer = () => {
  const { advanceToStep, finalizeIntervention, isLoading } = usePPFWorkflow();

  if (isLoading) {
    return <div>loading-actions</div>;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void advanceToStep('inspection', { notes: 'fresh note' } as never, ['photo-1'])}
      >
        advance
      </button>
      <button
        type="button"
        onClick={() => void finalizeIntervention({ notes: 'final note' } as never, ['after-1'])}
      >
        finalize
      </button>
    </>
  );
};

describe('PPFWorkflowProvider', () => {
  const mockInterventions = interventionsIpc as jest.Mocked<typeof interventionsIpc>;
  const mockTasksGet = ipcClient.tasks.get as jest.Mock;

  const activeIntervention = {
    id: 'intervention-1',
    status: 'in_progress',
  };

  const progressResponse = {
    steps: [
      {
        id: 'step-1',
        intervention_id: 'intervention-1',
        step_type: 'inspection',
        step_status: 'in_progress',
        step_number: 1,
        collected_data: {},
        photo_urls: null,
        notes: null,
      },
      {
        id: 'step-2',
        intervention_id: 'intervention-1',
        step_type: 'preparation',
        step_status: 'pending',
        step_number: 2,
        collected_data: {},
        photo_urls: null,
        notes: null,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockInterventions.getActiveByTask.mockResolvedValue({
      type: 'ActiveRetrieved',
      intervention: activeIntervention,
    } as never);
    mockInterventions.getProgress.mockResolvedValue(progressResponse as never);
    mockTasksGet.mockResolvedValue({
      id: 'task-123',
      vehicle_make: 'Tesla',
      vehicle_model: 'Model 3',
    });
  });

  it('provides workflow context to consumers', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <PPFWorkflowProvider taskId="task-123">
          <WorkflowConsumer />
        </PPFWorkflowProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('task-123:2')).toBeInTheDocument();
    });
  });

  it('uses the current collected note when advancing a step', async () => {
    mockInterventions.advanceStep.mockResolvedValue({
      step: progressResponse.steps[0],
      next_step: progressResponse.steps[1],
      progress_percentage: 50,
      requirements_completed: [],
    } as never);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <PPFWorkflowProvider taskId="task-123">
          <WorkflowActionsConsumer />
        </PPFWorkflowProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('advance')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('advance'));

    await waitFor(() => {
      expect(mockInterventions.advanceStep).toHaveBeenCalledWith({
        intervention_id: 'intervention-1',
        step_id: 'step-1',
        collected_data: { notes: 'fresh note' },
        photos: ['photo-1'],
        notes: 'fresh note',
        quality_check_passed: true,
        issues: null,
      });
    });
  });

  it('derives final observations from the finalization note', async () => {
    mockInterventions.finalize.mockResolvedValue({
      intervention: { ...activeIntervention, status: 'completed' },
      metrics: {},
    } as never);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <PPFWorkflowProvider taskId="task-123">
          <WorkflowActionsConsumer />
        </PPFWorkflowProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('finalize')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('finalize'));

    await waitFor(() => {
      expect(mockInterventions.finalize).toHaveBeenCalledWith({
        intervention_id: 'intervention-1',
        collected_data: { notes: 'final note' },
        photos: ['after-1'],
        customer_satisfaction: null,
        quality_score: null,
        final_observations: ['final note'],
        customer_signature: null,
        customer_comments: null,
      });
    });
  });
});
