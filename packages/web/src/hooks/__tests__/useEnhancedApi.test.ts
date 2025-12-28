import { renderHook, act, waitFor } from '@testing-library/react';
import { useEnhancedApi, clearApiCache } from '../useEnhancedApi';
import { showError } from '@/components/ui/Toast';

jest.mock('@/components/ui/Toast', () => ({
  showError: jest.fn()
}));

describe('useEnhancedApi', () => {
  const mockApiCall = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    clearApiCache();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useEnhancedApi(mockApiCall));

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should execute immediately if immediate option is true', async () => {
    const mockData = { id: 1, name: 'Test' };
    mockApiCall.mockResolvedValueOnce(mockData);

    const { result } = renderHook(() => useEnhancedApi(mockApiCall, { immediate: true }));

    expect(result.current.loading).toBe(true);
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.loading).toBe(false);
    expect(mockApiCall).toHaveBeenCalled();
  });

  it('should execute manually when execute is called', async () => {
    const mockData = { success: true };
    mockApiCall.mockResolvedValueOnce(mockData);

    const { result } = renderHook(() => useEnhancedApi(mockApiCall));

    let data;
    await act(async () => {
      data = await result.current.execute('arg1');
    });

    expect(data).toEqual(mockData);
    expect(result.current.data).toEqual(mockData);
    expect(mockApiCall).toHaveBeenCalledWith('arg1');
  });

  it('should handle errors and show global toast by default', async () => {
    const mockError = { message: 'API Error', status: 500, code: 'ERR_500' };
    mockApiCall.mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useEnhancedApi(mockApiCall));

    await act(async () => {
      await result.current.execute();
    });

    // Use a small delay if needed, though act should handle it
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).not.toBeNull();
    });

    expect(result.current.error?.message).toBe('API Error');
    expect(showError).toHaveBeenCalledWith('API Error');
  });

  it('should not show global toast if showGlobalError is false', async () => {
    const mockError = { message: 'Silent Error', status: 500 };
    mockApiCall.mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useEnhancedApi(mockApiCall, { showGlobalError: false }));

    await act(async () => {
      await result.current.execute();
    });

    expect(showError).not.toHaveBeenCalled();
  });
});
