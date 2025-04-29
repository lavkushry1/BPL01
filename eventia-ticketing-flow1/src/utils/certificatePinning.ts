/**
 * Certificate Pinning utility for enhancing mobile PWA security
 * Helps protect against man-in-the-middle attacks by verifying server certificates
 */

// Store for pinned certificate hashes
interface PinnedCertificates {
  [domain: string]: string[];
}

// Default pinned certificates for our domains
// In a real app, these would be actual SHA-256 fingerprints of our certificates
const DEFAULT_PINNED_CERTIFICATES: PinnedCertificates = {
  'eventia.example.com': [
    'sha256/EXAMPLE_HASH_1_REPLACE_WITH_REAL_CERT_FINGERPRINT',
    'sha256/EXAMPLE_HASH_2_BACKUP_CERT_FINGERPRINT',
  ],
  'api.eventia.example.com': [
    'sha256/EXAMPLE_HASH_3_REPLACE_WITH_REAL_CERT_FINGERPRINT',
    'sha256/EXAMPLE_HASH_4_BACKUP_CERT_FINGERPRINT',
  ],
};

// Load pinned certificates from localStorage or use defaults
const loadPinnedCertificates = (): PinnedCertificates => {
  try {
    const saved = localStorage.getItem('pinnedCertificates');
    return saved ? JSON.parse(saved) : DEFAULT_PINNED_CERTIFICATES;
  } catch (e) {
    console.error('Failed to load pinned certificates:', e);
    return DEFAULT_PINNED_CERTIFICATES;
  }
};

// Save pinned certificates to localStorage
const savePinnedCertificates = (certificates: PinnedCertificates): void => {
  try {
    localStorage.setItem('pinnedCertificates', JSON.stringify(certificates));
  } catch (e) {
    console.error('Failed to save pinned certificates:', e);
  }
};

/**
 * Get pinned certificates for a domain
 * @param domain Domain to get pins for
 * @returns Array of certificate hashes
 */
export const getPinnedCertificates = (domain: string): string[] => {
  const certificates = loadPinnedCertificates();
  return certificates[domain] || [];
};

/**
 * Add a pinned certificate for a domain
 * @param domain Domain to add pin for
 * @param certificateHash SHA-256 hash of the certificate
 */
export const addPinnedCertificate = (domain: string, certificateHash: string): void => {
  const certificates = loadPinnedCertificates();
  
  if (!certificates[domain]) {
    certificates[domain] = [];
  }
  
  if (!certificates[domain].includes(certificateHash)) {
    certificates[domain].push(certificateHash);
    savePinnedCertificates(certificates);
  }
};

/**
 * Remove a pinned certificate for a domain
 * @param domain Domain to remove pin from
 * @param certificateHash SHA-256 hash of the certificate to remove
 */
export const removePinnedCertificate = (domain: string, certificateHash: string): void => {
  const certificates = loadPinnedCertificates();
  
  if (certificates[domain]) {
    certificates[domain] = certificates[domain].filter(hash => hash !== certificateHash);
    savePinnedCertificates(certificates);
  }
};

/**
 * Reset pinned certificates to defaults
 */
export const resetPinnedCertificates = (): void => {
  savePinnedCertificates(DEFAULT_PINNED_CERTIFICATES);
};

// Create a modified fetch function that validates certificates
// Note: This is a simplified implementation since browser fetch doesn't expose certificate details
// In a real app, this would use a service worker or browser extension to access certificate data
export const secureFetch = async (
  url: string | URL,
  options?: RequestInit
): Promise<Response> => {
  const urlObj = typeof url === 'string' ? new URL(url) : url;
  const domain = urlObj.hostname;
  
  try {
    // Perform the fetch
    const response = await fetch(url, options);
    
    // In a real implementation, we would verify the certificate here
    // For demonstration purposes, we'll just check if the domain is in our pinned list
    if (getPinnedCertificates(domain).length > 0) {
      console.log(`Certificate pinning would validate ${domain} here`);
      // This would actually verify certificate fingerprints
    }
    
    return response;
  } catch (error) {
    // If this was a certificate error, we'd handle it specifically
    console.error(`Fetch error for ${domain}:`, error);
    
    // Re-throw the error
    throw error;
  }
};

/**
 * Configure Strict Transport Security for PWA
 * @param maxAge Max age in seconds for HSTS (default: 180 days)
 */
export const configureHSTS = (maxAge = 15552000): void => {
  // In a real app, this would be part of server configuration
  // For PWA, we can check and verify the headers
  try {
    // Check if HSTS headers are present
    fetch(window.location.origin, { method: 'HEAD' })
      .then(response => {
        const hstsHeader = response.headers.get('Strict-Transport-Security');
        if (!hstsHeader) {
          console.warn('HSTS header not found. Security is reduced.');
        } else {
          console.log('HSTS header found:', hstsHeader);
          // Here we could verify the header has the expected parameters
        }
      })
      .catch(error => {
        console.error('Failed to check HSTS headers:', error);
      });
  } catch (e) {
    console.error('Failed to configure HSTS:', e);
  }
};

// Initialize HSTS check when module loads
if (typeof window !== 'undefined') {
  // Only run in browser environment
  configureHSTS();
} 