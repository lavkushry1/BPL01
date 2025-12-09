import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  isWebAuthnSupported,
  checkBiometricCapability,
  registerBiometric,
  authenticateWithBiometric
} from '../../../utils/webauthn';

describe('WebAuthn Utilities', () => {
  // Mock credentials API
  const mockCredential = {
    id: 'credential-id',
    rawId: new ArrayBuffer(8),
    type: 'public-key',
    authenticatorAttachment: 'platform',
    response: {
      attestationObject: new ArrayBuffer(8),
      clientDataJSON: new ArrayBuffer(8),
      authenticatorData: new ArrayBuffer(8),
      signature: new ArrayBuffer(8),
      userHandle: new ArrayBuffer(8),
    },
  };
  
  // Save originals
  let originalPublicKeyCredential: any;
  let originalNavigatorCredentials: any;
  let originalAtob: any;
  let originalBtoa: any;
  
  beforeEach(() => {
    // Save original values
    originalPublicKeyCredential = window.PublicKeyCredential;
    originalNavigatorCredentials = navigator.credentials;
    originalAtob = window.atob;
    originalBtoa = window.btoa;
    
    // Mock atob and btoa
    window.atob = vi.fn(str => str);
    window.btoa = vi.fn(str => str);
    
    // Mock PublicKeyCredential
    (window as any).PublicKeyCredential = function() {};
    window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable = 
      vi.fn().mockResolvedValue(true);
    
    // Mock navigator.credentials
    Object.defineProperty(navigator, 'credentials', {
      value: {
        create: vi.fn().mockResolvedValue(mockCredential),
        get: vi.fn().mockResolvedValue(mockCredential)
      },
      writable: true
    });
    
    // Spy on console.error
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    // Restore original values
    (window as any).PublicKeyCredential = originalPublicKeyCredential;
    Object.defineProperty(navigator, 'credentials', {
      value: originalNavigatorCredentials,
      writable: true
    });
    window.atob = originalAtob;
    window.btoa = originalBtoa;
    
    // Clear mocks
    vi.clearAllMocks();
  });
  
  describe('isWebAuthnSupported', () => {
    it('returns true when WebAuthn is supported', () => {
      expect(isWebAuthnSupported()).toBe(true);
    });
    
    it('returns false when WebAuthn is not supported', () => {
      // Remove PublicKeyCredential
      (window as any).PublicKeyCredential = undefined;
      
      expect(isWebAuthnSupported()).toBe(false);
    });
  });
  
  describe('checkBiometricCapability', () => {
    it('returns true when biometric authentication is available', async () => {
      const result = await checkBiometricCapability();
      
      expect(result).toBe(true);
      expect(window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable).toHaveBeenCalled();
    });
    
    it('returns false when WebAuthn is not supported', async () => {
      // Remove PublicKeyCredential
      (window as any).PublicKeyCredential = undefined;
      
      const result = await checkBiometricCapability();
      
      expect(result).toBe(false);
    });
    
    it('returns false when biometric check throws an error', async () => {
      // Mock error
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable = 
        vi.fn().mockRejectedValue(new Error('Test error'));
      
      const result = await checkBiometricCapability();
      
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });
  
  describe('registerBiometric', () => {
    it('registers a biometric credential successfully', async () => {
      const userId = 'user123';
      const username = 'testuser';
      const displayName = 'Test User';
      const serverChallenge = 'challenge123';
      
      const result = await registerBiometric(userId, username, displayName, serverChallenge);
      
      expect(navigator.credentials.create).toHaveBeenCalled();
      expect(result).toHaveProperty('id', 'credential-id');
      expect(result).toHaveProperty('type', 'public-key');
    });
    
    it('throws error when WebAuthn is not supported', async () => {
      // Remove PublicKeyCredential
      (window as any).PublicKeyCredential = undefined;
      
      await expect(
        registerBiometric('user123', 'testuser', 'Test User', 'challenge123')
      ).rejects.toThrow('WebAuthn is not supported');
    });
    
    it('throws error when credential creation fails', async () => {
      // Mock creation failure
      (navigator.credentials.create as any).mockRejectedValue(new Error('Creation failed'));
      
      await expect(
        registerBiometric('user123', 'testuser', 'Test User', 'challenge123')
      ).rejects.toThrow('Creation failed');
      
      expect(console.error).toHaveBeenCalled();
    });
    
    it('throws error when no credential is returned', async () => {
      // Mock null return
      (navigator.credentials.create as any).mockResolvedValue(null);
      
      await expect(
        registerBiometric('user123', 'testuser', 'Test User', 'challenge123')
      ).rejects.toThrow('No credential returned');
    });
  });
  
  describe('authenticateWithBiometric', () => {
    it('authenticates with biometric successfully', async () => {
      const serverChallenge = 'challenge123';
      
      const result = await authenticateWithBiometric(serverChallenge);
      
      expect(navigator.credentials.get).toHaveBeenCalled();
      expect(result).toHaveProperty('id', 'credential-id');
      expect(result).toHaveProperty('type', 'public-key');
    });
    
    it('includes allowed credentials when provided', async () => {
      const serverChallenge = 'challenge123';
      const allowedCredentials = [
        { id: 'cred1', type: 'public-key' as const },
        { id: 'cred2', type: 'public-key' as const }
      ];
      
      await authenticateWithBiometric(serverChallenge, allowedCredentials);
      
      // Verify credentials.get was called with allowCredentials option
      const getCall = (navigator.credentials.get as any).mock.calls[0][0];
      expect(getCall.publicKey).toHaveProperty('allowCredentials');
      expect(getCall.publicKey.allowCredentials.length).toBe(2);
    });
    
    it('throws error when WebAuthn is not supported', async () => {
      // Remove PublicKeyCredential
      (window as any).PublicKeyCredential = undefined;
      
      await expect(
        authenticateWithBiometric('challenge123')
      ).rejects.toThrow('WebAuthn is not supported');
    });
    
    it('throws error when authentication fails', async () => {
      // Mock get failure
      (navigator.credentials.get as any).mockRejectedValue(new Error('Authentication failed'));
      
      await expect(
        authenticateWithBiometric('challenge123')
      ).rejects.toThrow('Authentication failed');
      
      expect(console.error).toHaveBeenCalled();
    });
    
    it('throws error when no credential is returned', async () => {
      // Mock null return
      (navigator.credentials.get as any).mockResolvedValue(null);
      
      await expect(
        authenticateWithBiometric('challenge123')
      ).rejects.toThrow('No credential returned');
    });
  });
}); 