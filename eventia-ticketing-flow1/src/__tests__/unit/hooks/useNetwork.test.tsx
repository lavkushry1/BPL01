import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useNetwork from '../../../hooks/useNetwork';
import * as networkUtils from '../../../utils/network';

// Mock the network utilities
vi.mock('../../../utils/network', () => ({
  getConnectionInfo: vi.fn(),
  listenForNetworkChanges: vi.fn(),
}));

describe('useNetwork Hook', () => {
  // Mock connection info
  const mockConnectionInfo = {
    downlink: 10,
    effectiveType: '4g',
    rtt: 50,
    saveData: false,
    isOnline: true,
    isConnectionFast: true,
  };
  
  // Mock updated connection info
  const updatedConnectionInfo = {
    ...mockConnectionInfo,
    isOnline: false,
    effectiveType: '3g',
    isConnectionFast: false,
  };
  
  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();
    
    // Setup default mock implementations
    (networkUtils.getConnectionInfo as any).mockReturnValue(mockConnectionInfo);
    
    // Setup listenForNetworkChanges to call the callback and return a cleanup function
    (networkUtils.listenForNetworkChanges as any).mockImplementation((callback) => {
      // Store the callback to trigger it later in tests
      (networkUtils.listenForNetworkChanges as any).callback = callback;
      return vi.fn(); // Return a mock cleanup function
    });
  });
  
  it('returns the initial connection info', () => {
    const { result } = renderHook(() => useNetwork());
    
    // Check initial state matches mock data
    expect(result.current).toEqual(mockConnectionInfo);
    expect(networkUtils.getConnectionInfo).toHaveBeenCalledTimes(1);
  });
  
  it('sets up a listener for network changes', () => {
    renderHook(() => useNetwork());
    
    // Check listener was set up
    expect(networkUtils.listenForNetworkChanges).toHaveBeenCalledTimes(1);
    expect(networkUtils.listenForNetworkChanges).toHaveBeenCalledWith(expect.any(Function));
  });
  
  it('updates state when network status changes', () => {
    const { result } = renderHook(() => useNetwork());
    
    // Initial state
    expect(result.current).toEqual(mockConnectionInfo);
    
    // Simulate network change
    act(() => {
      // Call the stored callback with updated connection info
      const callback = (networkUtils.listenForNetworkChanges as any).callback;
      callback(updatedConnectionInfo);
    });
    
    // Check state was updated
    expect(result.current).toEqual(updatedConnectionInfo);
  });
  
  it('cleans up listeners on unmount', () => {
    // Setup cleanup function spy
    const mockCleanup = vi.fn();
    (networkUtils.listenForNetworkChanges as any).mockReturnValue(mockCleanup);
    
    // Render and unmount the hook
    const { unmount } = renderHook(() => useNetwork());
    unmount();
    
    // Check cleanup was called
    expect(mockCleanup).toHaveBeenCalledTimes(1);
  });
}); 