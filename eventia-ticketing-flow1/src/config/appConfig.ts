/**
 * @module AppConfig
 * @description Centralized configuration service that provides access to the project.config.json settings
 * throughout the application. Handles loading the configuration and providing typed access to features,
 * backend endpoints, and static assets.
 */

import configData from '../../../project.config.json';

// Define types for better TypeScript integration
export interface ApiEndpoint {
  method: string;
  path: string;
  controller?: string;
  status: 'implemented' | 'missing';
}

export interface FeatureLocation {
  component: string;
  path: string;
}

export interface Feature {
  name: string;
  frontendLocation: FeatureLocation;
  backendEndpoints: Record<string, ApiEndpoint>;
  assets?: Record<string, any>;
  websocket?: {
    events: string[];
  };
}

export interface AppConfig {
  version: string;
  apiBasePath: string;
  frontendUrl: string;
  features: Record<string, Feature>;
  missingEndpoints: string[];
  staticAssets: {
    baseUrl: string;
    images: Record<string, any>;
  };
}

// Type assertion to ensure configData has the expected structure
const config = configData as AppConfig;

class ConfigService {
  private config: AppConfig;
  public stripePublicKey: string;

  constructor(configData: AppConfig) {
    this.config = configData;
    // Get Stripe public key from environment variables
    this.stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_dummy_key_for_development';
  }

  /**
   * Get the API URL for a specific feature endpoint
   * @param featureKey The key of the feature in the config
   * @param endpointKey The key of the endpoint within the feature
   * @param params Optional parameters to replace in the path (e.g., :id)
   * @returns The full API URL for the endpoint
   */
  getApiUrl(featureKey: string, endpointKey: string, params?: Record<string, string>): string {
    const feature = this.config.features[featureKey];
    if (!feature) {
      throw new Error(`Feature ${featureKey} not found in configuration`);
    }

    const endpoint = feature.backendEndpoints[endpointKey];
    if (!endpoint) {
      throw new Error(`Endpoint ${endpointKey} not found in feature ${featureKey}`);
    }

    let path = endpoint.path;

    // Replace path parameters if provided
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        path = path.replace(`:${key}`, value);
      });
    }

    // Fix: Remove the apiBasePath since it's already included in the API_URL from apiUtils.ts
    return path;
  }

  /**
   * Get the HTTP method for a specific feature endpoint
   * @param featureKey The key of the feature in the config
   * @param endpointKey The key of the endpoint within the feature
   * @returns The HTTP method (GET, POST, etc.)
   */
  getApiMethod(featureKey: string, endpointKey: string): string {
    const feature = this.config.features[featureKey];
    if (!feature) {
      throw new Error(`Feature ${featureKey} not found in configuration`);
    }

    const endpoint = feature.backendEndpoints[endpointKey];
    if (!endpoint) {
      throw new Error(`Endpoint ${endpointKey} not found in feature ${featureKey}`);
    }

    return endpoint.method;
  }

  /**
   * Get a static asset URL
   * @param path The path to the asset relative to the staticAssets.baseUrl
   * @returns The full URL to the static asset
   */
  getAssetUrl(path: string): string {
    return `${this.config.staticAssets.baseUrl}${path}`;
  }

  /**
   * Get an image asset URL
   * @param key The image key in the configuration (e.g., 'logo', 'backgrounds.login')
   * @returns The full URL to the image asset
   */
  getImageUrl(key: string): string {
    const parts = key.split('.');
    let current: any = this.config.staticAssets.images;

    for (const part of parts) {
      if (current[part] === undefined) {
        throw new Error(`Image key ${key} not found in configuration`);
      }
      current = current[part];
    }

    // If the result is an object with a path property, return the baseUrl + path
    if (typeof current === 'object' && current.path) {
      return `${this.config.staticAssets.baseUrl}${current.path}`;
    }

    // Otherwise, assume it's a direct path
    return `${this.config.staticAssets.baseUrl}${current}`;
  }

  /**
   * Check if a feature is implemented in the backend
   * @param featureKey The key of the feature in the config
   * @returns true if all endpoints for the feature are implemented, false otherwise
   */
  isFeatureImplemented(featureKey: string): boolean {
    const feature = this.config.features[featureKey];
    if (!feature) {
      throw new Error(`Feature ${featureKey} not found in configuration`);
    }

    // If there are no backend endpoints, consider it implemented
    if (Object.keys(feature.backendEndpoints).length === 0) {
      return true;
    }

    // Check if all endpoints are implemented
    return Object.values(feature.backendEndpoints).every(
      endpoint => endpoint.status === 'implemented'
    );
  }

  /**
   * Get the full configuration
   * @returns The complete configuration object
   */
  getFullConfig(): AppConfig {
    return this.config;
  }
}

// Create and export a singleton instance
const configService = new ConfigService(config);
export default configService;
