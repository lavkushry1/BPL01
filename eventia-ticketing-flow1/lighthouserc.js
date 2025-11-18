module.exports = {
  ci: {
    collect: {
      /* These settings are set via the CLI in the GitHub Actions workflow */
      numberOfRuns: 3,
      settings: {
        // Use mobile preset by default
        preset: 'mobile',
        
        // Throttling settings for mobile simulation
        throttling: {
          // Simulate a slow 4G connection
          downloadThroughputKbps: 1600,
          uploadThroughputKbps: 750,
          cpuSlowdownMultiplier: 2,
        },
        
        // Chrome flags
        chromeFlags: '--no-sandbox --headless --disable-gpu',
        
        // Enable mobile emulation
        emulatedFormFactor: 'mobile',
      },
    },
    assert: {
      preset: 'lighthouse:no-pwa',
      assertions: {
        // Performance metrics
        'first-contentful-paint': ['error', {maxNumericValue: 2000}],  // 2s for mobile
        'largest-contentful-paint': ['error', {maxNumericValue: 2500}], // 2.5s for mobile
        'cumulative-layout-shift': ['error', {maxNumericValue: 0.1}],   // 0.1 max CLS
        'total-blocking-time': ['error', {maxNumericValue: 200}],       // 200ms max TBT
        'interactive': ['error', {maxNumericValue: 3500}],              // 3.5s TTI
        
        // Mobile-specific assertions
        'content-width': ['error', {minScore: 1}],                      // Content fits viewport
        'tap-targets': ['error', {minScore: 0.9}],                      // 90% of tap targets are properly sized
        'uses-responsive-images': ['error', {minScore: 0.9}],           // 90% of images are responsive
        
        // Resource budgets
        'resource-summary:document:size': ['error', {maxNumericValue: 20000}],  // 20KB HTML
        'resource-summary:font:size': ['error', {maxNumericValue: 100000}],     // 100KB fonts
        'resource-summary:image:size': ['error', {maxNumericValue: 200000}],    // 200KB images
        'resource-summary:script:size': ['error', {maxNumericValue: 300000}],   // 300KB JS
        'resource-summary:stylesheet:size': ['error', {maxNumericValue: 100000}], // 100KB CSS
        'resource-summary:third-party:size': ['error', {maxNumericValue: 200000}], // 200KB 3rd party
        
        // Accessibility for mobile
        'color-contrast': ['error', {minScore: 1}],                     // All text has sufficient contrast
        'aria-allowed-attr': ['error', {minScore: 1}],                  // No invalid ARIA attributes
        'button-name': ['error', {minScore: 1}],                        // All buttons have accessible names
        'document-title': ['error', {minScore: 1}],                     // Document has title
        'html-has-lang': ['error', {minScore: 1}],                      // HTML has lang attribute
        'image-alt': ['error', {minScore: 1}],                          // All images have alt text
        'meta-viewport': ['error', {minScore: 1}],                      // Viewport meta tag is properly set
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};