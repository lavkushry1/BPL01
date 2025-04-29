import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  isServiceWorkerSupported,
  registerServiceWorker,
  updateServiceWorker,
  unregisterServiceWorkers
} from '../../../utils/serviceWorker';

describe('Service Worker Utilities', () => {
  // Mock service worker registration
  const mockRegistration = {
    scope: '/mock-scope',
    update: vi.fn().mockResolvedValue(undefined),
    unregister: vi.fn().mockResolvedValue(true),
    waiting: null
  };
  
  // Mock navigatior.serviceWorker
  const mockServiceWorker = {
    register: vi.fn().mockResolvedValue(mockRegistration),
    getRegistration: vi.fn().mockResolvedValue(mockRegistration),
    getRegistrations: vi.fn().mockResolvedValue([mockRegistration]),
    addEventListener: vi.fn(),
    controller: null
  };
  
  // Save original navigator
  let originalNavigator: any;
  
  beforeEach(() => {
    // Save original values
    originalNavigator = { ...window.navigator };
    
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock navigator with service worker support
    Object.defineProperty(window, 'navigator', {
      value: {
        ...window.navigator,
        serviceWorker: mockServiceWorker
      },
      writable: true
    });
    
    // Mock caches API
    if (typeof window.caches === 'undefined') {
      Object.defineProperty(window, 'caches', {
        value: {
          keys: vi.fn().mockResolvedValue(['test-cache']),
          delete: vi.fn().mockResolvedValue(true)
        },
        writable: true
      });
    }
    
    // Reset mocks before each test
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    // Restore original navigator
    Object.defineProperty(window, 'navigator', {
      value: originalNavigator,
      writable: true
    });
  });
  
  describe('isServiceWorkerSupported', () => {
    it('returns true when service workers are supported', () => {
      expect(isServiceWorkerSupported()).toBe(true);
    });
    
    it('returns false when service workers are not supported', () => {
      // Remove serviceWorker from navigator
      Object.defineProperty(window, 'navigator', {
        value: {
          ...window.navigator,
          serviceWorker: undefined
        },
        writable: true
      });
      
      expect(isServiceWorkerSupported()).toBe(false);
    });
  });
  
  describe('registerServiceWorker', () => {
    it('registers a service worker successfully', async () => {
      const registration = await registerServiceWorker();
      
      expect(mockServiceWorker.register).toHaveBeenCalledWith('/sw.js', { scope: '/' });
      expect(registration).toBe(mockRegistration);
    });
    
    it('returns null when service workers are not supported', async () => {
      // Remove serviceWorker from navigator
      Object.defineProperty(window, 'navigator', {
        value: {
          ...window.navigator,
          serviceWorker: undefined
        },
        writable: true
      });
      
      const registration = await registerServiceWorker();
      
      expect(registration).toBeNull();
      expect(console.warn).toHaveBeenCalled();
    });
    
    it('handles registration errors', async () => {
      // Mock registration failure
      mockServiceWorker.register.mockRejectedValueOnce(new Error('Registration failed'));
      
      const registration = await registerServiceWorker();
      
      expect(registration).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });
  
  describe('updateServiceWorker', () => {
    it('updates an existing service worker', async () => {
      const onUpdate = vi.fn();
      await updateServiceWorker(mockRegistration as unknown as ServiceWorkerRegistration, onUpdate);
      
      expect(mockRegistration.update).toHaveBeenCalled();
    });
    
    it('calls onUpdate when there is a waiting worker', async () => {
      // Mock a waiting worker
      const mockWaiting = {
        postMessage: vi.fn()
      };
      
      const mockRegWithWaiting = {
        ...mockRegistration,
        waiting: mockWaiting,
        update: vi.fn().mockResolvedValue(undefined)
      };
      
      const onUpdate = vi.fn();
      await updateServiceWorker(mockRegWithWaiting as unknown as ServiceWorkerRegistration, onUpdate);
      
      expect(onUpdate).toHaveBeenCalled();
      expect(mockWaiting.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    });
    
    it('handles update errors', async () => {
      // Mock update failure
      mockRegistration.update.mockRejectedValueOnce(new Error('Update failed'));
      
      await updateServiceWorker(mockRegistration as unknown as ServiceWorkerRegistration);
      
      expect(console.error).toHaveBeenCalled();
    });
  });
  
  describe('unregisterServiceWorkers', () => {
    it('unregisters all service workers', async () => {
      const result = await unregisterServiceWorkers();
      
      expect(result).toBe(true);
      expect(mockServiceWorker.getRegistrations).toHaveBeenCalled();
      expect(mockRegistration.unregister).toHaveBeenCalled();
    });
    
    it('clears all caches', async () => {
      await unregisterServiceWorkers();
      
      // Check that caches were cleared
      expect(window.caches.keys).toHaveBeenCalled();
      expect(window.caches.delete).toHaveBeenCalledWith('test-cache');
    });
    
    it('returns false when service workers are not supported', async () => {
      // Remove serviceWorker from navigator
      Object.defineProperty(window, 'navigator', {
        value: {
          ...window.navigator,
          serviceWorker: undefined
        },
        writable: true
      });
      
      const result = await unregisterServiceWorkers();
      
      expect(result).toBe(false);
    });
    
    it('handles unregistration errors', async () => {
      // Mock getRegistrations failure
      mockServiceWorker.getRegistrations.mockRejectedValueOnce(new Error('Unregistration failed'));
      
      const result = await unregisterServiceWorkers();
      
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });
}); 