/**
 * CDN Configuration for Eventia Frontend
 * 
 * This file contains configuration for CDN deployment of static assets.
 * It's used by the frontend-cdn-deploy.yml GitHub Actions workflow.
 */

module.exports = {
  // S3 bucket configuration
  s3: {
    // Files that should have specific cache control settings
    cacheControl: [
      {
        // HTML files should have a shorter cache time to ensure updates are seen quickly
        pattern: '**/*.html',
        value: 'public, max-age=300' // 5 minutes
      },
      {
        // Service worker files should have a short cache time
        pattern: '**/sw.js',
        value: 'public, max-age=0, must-revalidate'
      },
      {
        // Hashed assets can have a long cache time
        pattern: '**/*.+([0-9a-f]).+(js|css|png|jpg|jpeg|gif|webp|svg|woff|woff2)',
        value: 'public, max-age=31536000, immutable' // 1 year
      },
      {
        // Default cache control for all other files
        pattern: '**/*',
        value: 'public, max-age=86400' // 24 hours
      }
    ],
    // Files that should have specific content types
    contentTypes: [
      {
        pattern: '**/*.webmanifest',
        value: 'application/manifest+json'
      },
      {
        pattern: '**/sw.js',
        value: 'application/javascript; charset=utf-8'
      }
    ]
  },
  
  // CloudFront configuration
  cloudfront: {
    // Default cache behavior
    defaultCacheBehavior: {
      allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
      cachedMethods: ['GET', 'HEAD', 'OPTIONS'],
      compress: true,
      defaultTTL: 86400, // 24 hours
      maxTTL: 31536000, // 1 year
      minTTL: 0,
      forwardedValues: {
        queryString: false,
        cookies: {
          forward: 'none'
        },
        headers: ['Origin', 'Access-Control-Request-Method', 'Access-Control-Request-Headers']
      },
      viewerProtocolPolicy: 'redirect-to-https'
    },
    
    // Path patterns with specific cache behaviors
    cacheBehaviors: [
      {
        pathPattern: '*.html',
        allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
        cachedMethods: ['GET', 'HEAD', 'OPTIONS'],
        compress: true,
        defaultTTL: 300, // 5 minutes
        maxTTL: 300, // 5 minutes
        minTTL: 0,
        forwardedValues: {
          queryString: false,
          cookies: {
            forward: 'none'
          },
          headers: ['Origin', 'Access-Control-Request-Method', 'Access-Control-Request-Headers']
        },
        viewerProtocolPolicy: 'redirect-to-https'
      },
      {
        pathPattern: 'sw.js',
        allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
        cachedMethods: ['GET', 'HEAD', 'OPTIONS'],
        compress: true,
        defaultTTL: 0,
        maxTTL: 0,
        minTTL: 0,
        forwardedValues: {
          queryString: false,
          cookies: {
            forward: 'none'
          },
          headers: ['Origin', 'Access-Control-Request-Method', 'Access-Control-Request-Headers']
        },
        viewerProtocolPolicy: 'redirect-to-https'
      }
    ],
    
    // Custom error responses
    customErrorResponses: [
      {
        errorCode: 404,
        responseCode: 200,
        responsePagePath: '/index.html'
      },
      {
        errorCode: 403,
        responseCode: 200,
        responsePagePath: '/index.html'
      }
    ],
    
    // Geographic restrictions
    geoRestriction: {
      restrictionType: 'none'
    },
    
    // Price class (determines which edge locations are used)
    // Options: PriceClass_100, PriceClass_200, PriceClass_All
    priceClass: 'PriceClass_100',
    
    // Whether to enable IPv6
    isIPV6Enabled: true,
    
    // Whether to enable HTTP/2
    httpVersion: 'http2',
    
    // Default root object
    defaultRootObject: 'index.html'
  }
};