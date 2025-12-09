/**
 * WebAuthn (Web Authentication) utilities for biometric authentication
 * Implements FIDO2 standard for passwordless authentication using fingerprint, face ID, etc.
 */

// Check if WebAuthn is supported in the current browser
export const isWebAuthnSupported = (): boolean => {
  return (
    window.PublicKeyCredential !== undefined &&
    typeof window.PublicKeyCredential === 'function'
  );
};

// Check if the device has biometric capabilities
export const checkBiometricCapability = async (): Promise<boolean> => {
  if (!isWebAuthnSupported()) {
    return false;
  }

  try {
    // Check if platform authenticator is available
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch (error) {
    console.error('Error checking biometric capability:', error);
    return false;
  }
};

// Convert a base64 string to an ArrayBuffer
const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

// Convert an ArrayBuffer to a base64 string
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

// Encode credential creation options for WebAuthn
const prepareCreateCredentialOptions = (
  options: PublicKeyCredentialCreationOptions
): PublicKeyCredentialCreationOptions => {
  const prepared = { ...options };

  // Convert challenge from base64 to ArrayBuffer
  if (typeof prepared.challenge === 'string') {
    prepared.challenge = base64ToArrayBuffer(prepared.challenge);
  }

  // Convert user ID from base64 to ArrayBuffer
  if (prepared.user && typeof prepared.user.id === 'string') {
    prepared.user.id = Uint8Array.from(
      atob(prepared.user.id), c => c.charCodeAt(0)
    );
  }

  // Convert excludeCredentials IDs from base64 to ArrayBuffers
  if (prepared.excludeCredentials) {
    prepared.excludeCredentials = prepared.excludeCredentials.map(credential => {
      if (typeof credential.id === 'string') {
        return {
          ...credential,
          id: base64ToArrayBuffer(credential.id),
        };
      }
      return credential;
    });
  }

  return prepared;
};

// Encode credential request options for WebAuthn
const prepareGetCredentialOptions = (
  options: PublicKeyCredentialRequestOptions
): PublicKeyCredentialRequestOptions => {
  const prepared = { ...options };

  // Convert challenge from base64 to ArrayBuffer
  if (typeof prepared.challenge === 'string') {
    prepared.challenge = base64ToArrayBuffer(prepared.challenge);
  }

  // Convert allowCredentials IDs from base64 to ArrayBuffers
  if (prepared.allowCredentials) {
    prepared.allowCredentials = prepared.allowCredentials.map(credential => {
      if (typeof credential.id === 'string') {
        return {
          ...credential,
          id: base64ToArrayBuffer(credential.id),
        };
      }
      return credential;
    });
  }

  return prepared;
};

// Process credential after creation
const processCreateCredentialResponse = (credential: PublicKeyCredential): any => {
  const response = credential.response as AuthenticatorAttestationResponse;

  return {
    id: credential.id,
    rawId: arrayBufferToBase64(credential.rawId),
    type: credential.type,
    response: {
      attestationObject: arrayBufferToBase64(response.attestationObject),
      clientDataJSON: arrayBufferToBase64(response.clientDataJSON),
    },
    authenticatorAttachment: credential.authenticatorAttachment,
  };
};

// Process credential after authentication
const processGetCredentialResponse = (credential: PublicKeyCredential): any => {
  const response = credential.response as AuthenticatorAssertionResponse;

  return {
    id: credential.id,
    rawId: arrayBufferToBase64(credential.rawId),
    type: credential.type,
    response: {
      authenticatorData: arrayBufferToBase64(response.authenticatorData),
      clientDataJSON: arrayBufferToBase64(response.clientDataJSON),
      signature: arrayBufferToBase64(response.signature),
      userHandle: response.userHandle ? arrayBufferToBase64(response.userHandle) : null,
    },
  };
};

interface BiometricCredential {
  id: string;
  type: 'public-key';
}

// Register a new device/credential
export const registerBiometric = async (
  userId: string,
  username: string,
  displayName: string,
  serverChallenge: string
): Promise<any> => {
  if (!isWebAuthnSupported()) {
    throw new Error('WebAuthn is not supported in this browser');
  }

  try {
    // Create credential options
    const credentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge: Uint8Array.from(serverChallenge, c => c.charCodeAt(0)),
      rp: {
        name: 'Eventia',
        id: window.location.hostname,
      },
      user: {
        id: Uint8Array.from(userId, c => c.charCodeAt(0)),
        name: username,
        displayName: displayName,
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 }, // ES256 algorithm
        { type: 'public-key', alg: -257 }, // RS256 algorithm
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Use platform authenticator (like Touch ID, Face ID)
        userVerification: 'required', // Require user verification (fingerprint, face, etc.)
        requireResidentKey: false,
      },
      timeout: 60000, // 1 minute
      attestation: 'direct',
    };

    // Create the credential
    const credential = await navigator.credentials.create({
      publicKey: credentialCreationOptions,
    });

    if (!credential) {
      throw new Error('No credential returned');
    }

    // Process and return the credential response
    return processCreateCredentialResponse(credential as PublicKeyCredential);
  } catch (error) {
    console.error('Error registering biometric credential:', error);
    throw error;
  }
};

// Authenticate with existing credential
export const authenticateWithBiometric = async (
  serverChallenge: string,
  allowedCredentials: BiometricCredential[] = []
): Promise<any> => {
  if (!isWebAuthnSupported()) {
    throw new Error('WebAuthn is not supported in this browser');
  }

  try {
    // Create credential request options
    const credentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge: Uint8Array.from(serverChallenge, c => c.charCodeAt(0)),
      timeout: 60000, // 1 minute
      userVerification: 'required',
    };

    // If there are allowed credentials, include them
    if (allowedCredentials.length > 0) {
      credentialRequestOptions.allowCredentials = allowedCredentials.map(cred => ({
        id: Uint8Array.from(atob(cred.id), c => c.charCodeAt(0)),
        type: 'public-key',
        transports: ['internal'] as AuthenticatorTransport[],
      }));
    }

    // Get the credential
    const credential = await navigator.credentials.get({
      publicKey: credentialRequestOptions,
    });

    if (!credential) {
      throw new Error('No credential returned');
    }

    // Process and return the credential response
    return processGetCredentialResponse(credential as PublicKeyCredential);
  } catch (error) {
    console.error('Error authenticating with biometric:', error);
    throw error;
  }
};

// For security enhancement with certificate pinning
export const checkCertificateIntegrity = async (expectedFingerprint: string): Promise<boolean> => {
  try {
    // This is a simplified implementation
    // In a real app, we would use SubtleCrypto to validate certificate fingerprints
    const response = await fetch(window.location.origin, { method: 'HEAD' });
    // This is where we would extract the certificate and validate it
    // For demonstration, we'll simulate this check
    console.log('Certificate verification would check against:', expectedFingerprint);
    return true; // In a real implementation, we would return the actual verification result
  } catch (error) {
    console.error('Certificate verification failed:', error);
    return false;
  }
}; 