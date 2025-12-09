/**
 * Configuration management for the Eventia frontend application
 * 
 * This file centralizes all environment-specific configuration values
 * and provides type-safe access to them throughout the application.
 */

// Define the environment
type Environment = 'development' | 'production' | 'test';

// Feature flags interface
interface FeatureFlags {
  useMockData: boolean;
  enableNewCheckout: boolean;
  enableDebugTools: boolean;
  enableAnalytics: boolean;
}

// API configuration interface
interface ApiConfig {
  baseUrl: string;
  wsUrl: string;
  timeout: number;
  retryAttempts: number;
}

// Authentication configuration interface
interface AuthConfig {
  accessTokenKey: string;
  refreshTokenKey: string;
  accessTokenExpiry: string; // For future use with token expiry management
  refreshTokenExpiry: string; // For future use with token expiry management
}

// Full configuration interface
interface AppConfig {
  environment: Environment;
  appName: string;
  api: ApiConfig;
  auth: AuthConfig;
  features: FeatureFlags;
  routes: {
    login: string;
    home: string;
    events: string;
    checkout: string;
  };
}

// Parse the current environment
const currentEnv = (import.meta.env.MODE || 'development') as Environment;

// Default configuration values
const defaultConfig: AppConfig = {
  environment: currentEnv,
  appName: 'Eventia',
  api: {
    baseUrl: '/api/v1',
    wsUrl: 'ws://localhost:4000',
    timeout: 30000, // 30 seconds
    retryAttempts: 3
  },
  auth: {
    accessTokenKey: 'eventia_access_token',
    refreshTokenKey: 'eventia_refresh_token',
    accessTokenExpiry: '15m',
    refreshTokenExpiry: '7d'
  },
  features: {
    useMockData: false,
    enableNewCheckout: false,
    enableDebugTools: false,
    enableAnalytics: false
  },
  routes: {
    login: '/login',
    home: '/',
    events: '/events',
    checkout: '/checkout'
  }
};

// Environment-specific overrides
const environmentConfig: Record<Environment, Partial<AppConfig>> = {
  development: {
    api: {
      baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1',
      wsUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:4000',
      timeout: 60000, // 60 seconds in development for debugging
      retryAttempts: 3
    },
    features: {
      useMockData: import.meta.env.VITE_USE_MOCK_DATA === 'true',
      enableNewCheckout: import.meta.env.VITE_ENABLE_NEW_CHECKOUT === 'true',
      enableDebugTools: true,
      enableAnalytics: false
    }
  },
  production: {
    api: {
      // In production, use relative URL for same-origin API or absolute URL if different
      baseUrl: import.meta.env.VITE_API_URL || '/api/v1',
      wsUrl: import.meta.env.VITE_WS_URL || window.location.origin.replace(/^http/, 'ws'),
      timeout: 30000, // 30 seconds in production
      retryAttempts: 5 // More retries in production
    },
    features: {
      useMockData: false, // Never use mock data in production
      enableNewCheckout: import.meta.env.VITE_ENABLE_NEW_CHECKOUT === 'true',
      enableDebugTools: false,
      enableAnalytics: true
    }
  },
  test: {
    api: {
      baseUrl: 'http://localhost:4000/api/v1',
      wsUrl: 'ws://localhost:4000',
      timeout: 5000, // Faster timeout in tests
      retryAttempts: 0 // No retries in test
    },
    features: {
      useMockData: true, // Always use mock data in test environment
      enableNewCheckout: true,
      enableDebugTools: true,
      enableAnalytics: false
    }
  }
};

// Create the final configuration by merging defaults with environment-specific overrides
const mergeConfig = (defaults: AppConfig, overrides: Partial<AppConfig>): AppConfig => {
  return {
    ...defaults,
    ...overrides,
    api: {
      ...defaults.api,
      ...overrides.api
    },
    auth: {
      ...defaults.auth,
      ...overrides.auth
    },
    features: {
      ...defaults.features,
      ...overrides.features
    },
    routes: {
      ...defaults.routes,
      ...overrides.routes
    }
  };
};

// Build the final configuration
const config = mergeConfig(defaultConfig, environmentConfig[currentEnv]);

// Validate the configuration in development and test modes
if (config.environment !== 'production') {
  console.log(`Eventia Frontend (${config.environment} mode) configuration:`, config);

  // Basic validation
  if (!config.api.baseUrl) {
    console.warn('API base URL is not set!');
  }
  
  if (config.features.useMockData) {
    console.warn('Using mock data - not suitable for production use!');
  }
}

export default config;

// Export specific sections for convenience
export const { api, auth, features } = config;

// Ensure we have API_BASE_URL export
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';
