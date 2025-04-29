/**
 * Secure storage utility for handling sensitive data like tokens
 * Provides basic obfuscation (not true encryption) to make tokens less vulnerable to XSS
 */

/**
 * Obfuscate token with basic encoding and device fingerprinting
 * This is NOT secure encryption, just basic protection against casual inspection
 */
const obfuscateToken = (token: string): string => {
  // Create a simple fingerprint using user agent and window properties
  const fingerprint = window.navigator.userAgent.replace(/\D+/g, '').slice(0, 8);
  const timestamp = new Date().getTime().toString(36).slice(-6);
  const key = fingerprint + timestamp;
  
  // Simple obfuscation by combining the fingerprint+timestamp with the token
  return btoa(`${key}:${token}`);
};

/**
 * Decode the obfuscated token
 */
const deobfuscateToken = (encoded: string): string | null => {
  try {
    const decoded = atob(encoded);
    const parts = decoded.split(':');
    if (parts.length < 2) return null;
    
    // Return only the token part
    return parts.slice(1).join(':');
  } catch (e) {
    console.error('Failed to decode token:', e);
    return null;
  }
};

/**
 * Secure storage wrapper for sessionStorage
 */
export const secureStorage = {
  /**
   * Store an item with obfuscation
   */
  setItem: (key: string, value: string): void => {
    try {
      const obfuscatedValue = obfuscateToken(value);
      sessionStorage.setItem(key, obfuscatedValue);
    } catch (e) {
      console.error('Failed to store item securely:', e);
    }
  },
  
  /**
   * Retrieve and deobfuscate an item
   */
  getItem: (key: string): string | null => {
    try {
      const obfuscatedValue = sessionStorage.getItem(key);
      if (!obfuscatedValue) return null;
      return deobfuscateToken(obfuscatedValue);
    } catch (e) {
      console.error('Failed to retrieve item securely:', e);
      return null;
    }
  },
  
  /**
   * Remove an item
   */
  removeItem: (key: string): void => {
    sessionStorage.removeItem(key);
  },
  
  /**
   * Clear all items
   */
  clear: (): void => {
    sessionStorage.clear();
  }
};

export default secureStorage; 