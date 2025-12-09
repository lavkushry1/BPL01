import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  getImageQuality, 
  getLoadingStrategy, 
  getConnectionInfo,
  getImageSize,
  listenForNetworkChanges
} from '../../../utils/network';

describe('Network Utilities', () => {
  // Mock navigator.connection
  const mockConnection = {
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
    saveData: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  };

  // Save original navigator
  let originalNavigator: any;
  let originalOnline: boolean;

  beforeEach(() => {
    // Save original values
    originalNavigator = { ...window.navigator };
    originalOnline = window.navigator.onLine;
    
    // Mock navigator
    Object.defineProperty(window, 'navigator', {
      value: {
        ...window.navigator,
        connection: mockConnection,
        onLine: true
      },
      writable: true
    });
    
    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original navigator
    Object.defineProperty(window, 'navigator', {
      value: originalNavigator,
      writable: true
    });
    
    // Restore original online status
    Object.defineProperty(window.navigator, 'onLine', {
      value: originalOnline,
      writable: true
    });
  });

  describe('getConnectionInfo', () => {
    it('returns correct connection info for 4G connection', () => {
      const info = getConnectionInfo();
      
      expect(info.effectiveType).toBe('4g');
      expect(info.downlink).toBe(10);
      expect(info.isOnline).toBe(true);
      expect(info.isConnectionFast).toBe(true);
    });

    it('returns correct connection info for offline state', () => {
      // Mock offline state
      Object.defineProperty(window.navigator, 'onLine', {
        value: false,
        writable: true
      });
      
      const info = getConnectionInfo();
      
      expect(info.isOnline).toBe(false);
    });

    it('handles missing connection API gracefully', () => {
      // Remove connection property
      Object.defineProperty(window, 'navigator', {
        value: {
          ...window.navigator,
          connection: null
        },
        writable: true
      });
      
      const info = getConnectionInfo();
      
      // Should use default values
      expect(info.effectiveType).toBe('4g');
      expect(info.downlink).toBe(10);
    });
  });

  describe('getImageQuality', () => {
    it('returns default quality for 4G connection', () => {
      const quality = getImageQuality(80);
      expect(quality).toBe(80);
    });

    it('returns lower quality for 3G connection', () => {
      // Mock 3G connection
      Object.defineProperty(window.navigator, 'connection', {
        value: {
          ...mockConnection,
          effectiveType: '3g'
        },
        writable: true
      });
      
      const quality = getImageQuality(80);
      expect(quality).toBe(60);
    });

    it('returns lowest quality when data saver is enabled', () => {
      // Mock data saver
      Object.defineProperty(window.navigator, 'connection', {
        value: {
          ...mockConnection,
          saveData: true
        },
        writable: true
      });
      
      const quality = getImageQuality(80);
      expect(quality).toBe(50);
    });
  });

  describe('getLoadingStrategy', () => {
    it('returns eager loading for fast connection', () => {
      const strategy = getLoadingStrategy();
      expect(strategy).toBe('eager');
    });

    it('returns lazy loading for slow connection', () => {
      // Mock slow connection
      Object.defineProperty(window.navigator, 'connection', {
        value: {
          ...mockConnection,
          effectiveType: '2g',
          isConnectionFast: false
        },
        writable: true
      });
      
      const strategy = getLoadingStrategy();
      expect(strategy).toBe('lazy');
    });
    
    it('returns lazy loading when data saver is enabled', () => {
      // Mock data saver
      Object.defineProperty(window.navigator, 'connection', {
        value: {
          ...mockConnection,
          saveData: true
        },
        writable: true
      });
      
      const strategy = getLoadingStrategy();
      expect(strategy).toBe('lazy');
    });
  });

  describe('getImageSize', () => {
    it('returns large size for fast connection', () => {
      const sizes = { sm: 100, md: 300, lg: 600, xl: 1200 };
      const size = getImageSize(sizes);
      expect(size).toBe(600);
    });
    
    it('returns small size for slow connection', () => {
      // Mock slow connection
      Object.defineProperty(window.navigator, 'connection', {
        value: {
          ...mockConnection,
          effectiveType: '2g'
        },
        writable: true
      });
      
      const sizes = { sm: 100, md: 300, lg: 600, xl: 1200 };
      const size = getImageSize(sizes);
      expect(size).toBe(100);
    });
    
    it('returns smallest size when data saver is enabled', () => {
      // Mock data saver
      Object.defineProperty(window.navigator, 'connection', {
        value: {
          ...mockConnection,
          saveData: true
        },
        writable: true
      });
      
      const sizes = { sm: 100, md: 300, lg: 600, xl: 1200 };
      const size = getImageSize(sizes);
      expect(size).toBe(100);
    });
  });

  describe('listenForNetworkChanges', () => {
    it('adds event listeners for online/offline events', () => {
      // Spy on addEventListener
      const addEventSpy = vi.spyOn(window, 'addEventListener');
      
      const callback = vi.fn();
      const cleanup = listenForNetworkChanges(callback);
      
      // Check that event listeners were added
      expect(addEventSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(addEventSpy).toHaveBeenCalledWith('offline', expect.any(Function));
      expect(mockConnection.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
      
      // Call cleanup
      cleanup();
      
      // Check that removeEventListener was called properly in cleanup
      const removeEventSpy = vi.spyOn(window, 'removeEventListener');
      expect(removeEventSpy).toHaveBeenCalled();
      expect(mockConnection.removeEventListener).toHaveBeenCalled();
    });
  });
}); 