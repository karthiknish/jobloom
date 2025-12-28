import { renderHook, act, waitFor } from '@testing-library/react';
import { useJobManagement } from '../useJobManagement';
import { dashboardApi } from '@/utils/api/dashboard';
import { showSuccess, showError } from '@/components/ui/Toast';
import { useSubscription } from '@/providers/subscription-provider';

jest.mock('@/utils/api/dashboard', () => ({
  dashboardApi: {
    createJob: jest.fn()
  }
}));

jest.mock('@/components/ui/Toast', () => ({
  showSuccess: jest.fn(),
  showError: jest.fn()
}));

jest.mock('@/hooks/useOnboardingState', () => ({
  useOnboardingState: jest.fn(() => ({
    hasAddedFirstJob: true,
    markFirstJobAdded: jest.fn()
  }))
}));

jest.mock('@/providers/subscription-provider', () => ({
  useSubscription: jest.fn(() => ({
    canUseFeature: jest.fn(() => true),
    currentUsage: { applications: 0 },
    limits: { applicationsPerMonth: 50 }
  }))
}));

describe('useJobManagement', () => {
  const mockRefetch = jest.fn();
  const mockOnUpgradeIntent = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default states', () => {
    const { result } = renderHook(() => useJobManagement(mockRefetch));
    expect(result.current.showJobForm).toBe(false);
    expect(result.current.showUpgradePrompt).toBe(false);
  });

  it('should handle successful job submission', async () => {
    const { result } = renderHook(() => useJobManagement(mockRefetch));
    const jobData: any = { company: 'Test Co', position: 'Developer' };
    
    (dashboardApi.createJob as jest.Mock).mockResolvedValueOnce({ success: true });

    await act(async () => {
      await result.current.handleJobSubmit(jobData);
    });

    expect(dashboardApi.createJob).toHaveBeenCalled();
    expect(mockRefetch).toHaveBeenCalled();
    expect(showSuccess).toHaveBeenCalled();
    expect(result.current.showJobForm).toBe(false);
  });

  it('should block submission when limit is reached', async () => {
    (useSubscription as jest.Mock).mockReturnValue({
      canUseFeature: jest.fn(() => false),
      currentUsage: { applications: 50 },
      limits: { applicationsPerMonth: 50 }
    });

    const { result } = renderHook(() => useJobManagement(mockRefetch, mockOnUpgradeIntent));
    
    await act(async () => {
      await result.current.handleJobSubmit({} as any);
    });

    expect(dashboardApi.createJob).not.toHaveBeenCalled();
    expect(mockOnUpgradeIntent).toHaveBeenCalled();
    expect(result.current.showUpgradePrompt).toBe(true);
  });
});
