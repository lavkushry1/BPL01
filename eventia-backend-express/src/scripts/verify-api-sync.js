/**
 * API Synchronization Verification Tool
 * 
 * This script verifies that the frontend API calls and backend API endpoints
 * are properly synchronized to prevent 404 errors and other mismatches.
 */
const fs = require('fs');
const path = require('path');
const colors = require('colors');

// Configuration
const BACKEND_ROUTES_DIR = path.join(__dirname, '..', 'routes');
const FRONTEND_API_DIR = path.join(__dirname, '..', '..', '..', 'eventia-ticketing-flow1', 'src', 'services', 'api');
const API_PREFIX = '/api/v1';

// Logging utilities
const logSuccess = (message) => console.log(colors.green(`✅ ${message}`));
const logError = (message) => console.log(colors.red(`❌ ${message}`));
const logInfo = (message) => console.log(colors.blue(`ℹ️ ${message}`));
const logWarning = (message) => console.log(colors.yellow(`⚠️ ${message}`));
const logHeader = (message) => console.log(colors.cyan.bold(`\n${message}`));

// Helper functions
const findFilesRecursively = (dir, filter = () => true) => {
  let results = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      results = results.concat(findFilesRecursively(filePath, filter));
    } else if (filter(filePath)) {
      results.push(filePath);
    }
  }
  
  return results;
};

// Extract backend routes
const extractBackendRoutes = () => {
  logHeader('Extracting Backend Routes');
  const routes = [];
  
  try {
    // Find all route files
    const routeFiles = findFilesRecursively(BACKEND_ROUTES_DIR, (file) => 
      file.endsWith('.ts') || file.endsWith('.js'));
    
    logInfo(`Found ${routeFiles.length} route files`);
    
    // Parse each route file for route definitions
    routeFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(BACKEND_ROUTES_DIR, file);
      
      // Extract route paths using regex
      const routeRegex = /router\.(get|post|put|patch|delete)\s*\(\s*['"](.*?)['"],?/g;
      let match;
      
      while ((match = routeRegex.exec(content)) !== null) {
        const method = match[1].toUpperCase();
        const routePath = match[2];
        
        // Skip parameterized routes for simple comparison
        const baseRoute = routePath.split('/')[1];
        
        routes.push({
          method,
          path: routePath,
          baseRoute,
          file: relativePath
        });
      }
    });
    
    // Also extract the main app.ts routes
    const appPath = path.join(__dirname, '..', 'app.ts');
    if (fs.existsSync(appPath)) {
      const appContent = fs.readFileSync(appPath, 'utf8');
      const appRouteRegex = /app\.use\s*\(\s*['"](.+?)['"],\s*(\w+)Routes\s*\)/g;
      let appMatch;
      
      while ((appMatch = appRouteRegex.exec(appContent)) !== null) {
        const routePath = appMatch[1];
        const routeVar = appMatch[2];
        
        routes.push({
          method: 'ROUTER',
          path: routePath,
          baseRoute: routePath.split('/').pop(),
          file: 'app.ts'
        });
      }
    }
    
    logSuccess(`Extracted ${routes.length} backend routes`);
    return routes;
  } catch (error) {
    logError(`Failed to extract backend routes: ${error.message}`);
    return [];
  }
};

// Extract frontend API calls
const extractFrontendAPICalls = () => {
  logHeader('Extracting Frontend API Calls');
  const apiCalls = [];
  
  try {
    // Find all API service files
    const apiFiles = findFilesRecursively(FRONTEND_API_DIR, (file) => 
      (file.endsWith('.ts') || file.endsWith('.js')) && !file.includes('.test.'));
    
    logInfo(`Found ${apiFiles.length} API service files`);
    
    // Parse each API file for API calls
    apiFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(FRONTEND_API_DIR, file);
      
      // Extract API calls using regex
      const apiCallRegex = /\.(get|post|put|patch|delete)\s*\(\s*['"](.*?)['"],?/g;
      let match;
      
      while ((match = apiCallRegex.exec(content)) !== null) {
        const method = match[1].toUpperCase();
        let apiPath = match[2];
        
        // Strip API_PREFIX if present
        if (apiPath.startsWith(API_PREFIX)) {
          apiPath = apiPath.substring(API_PREFIX.length);
        }
        
        // Handle `/api/v1` prefix if present
        if (apiPath.startsWith('/api/v1')) {
          apiPath = apiPath.substring(7);
        }
        
        // Skip parameterized paths for simple comparison
        const baseRoute = apiPath.split('/')[1];
        
        apiCalls.push({
          method,
          path: apiPath,
          baseRoute,
          file: relativePath
        });
      }
      
      // Also look for string literals that might be API paths
      const stringLiteralRegex = /['"`](\/api\/v1\/[a-zA-Z0-9\/_-]+)['"`]/g;
      let stringMatch;
      
      while ((stringMatch = stringLiteralRegex.exec(content)) !== null) {
        let apiPath = stringMatch[1];
        
        // Strip API_PREFIX if present
        if (apiPath.startsWith(API_PREFIX)) {
          apiPath = apiPath.substring(API_PREFIX.length);
        }
        
        // Handle `/api/v1` prefix if present
        if (apiPath.startsWith('/api/v1')) {
          apiPath = apiPath.substring(7);
        }
        
        const baseRoute = apiPath.split('/')[1];
        
        apiCalls.push({
          method: 'UNKNOWN',
          path: apiPath,
          baseRoute,
          file: relativePath
        });
      }
    });
    
    logSuccess(`Extracted ${apiCalls.length} frontend API calls`);
    return apiCalls;
  } catch (error) {
    logError(`Failed to extract frontend API calls: ${error.message}`);
    return [];
  }
};

// Verify synchronization
const verifyAPISynchronization = (backendRoutes, frontendAPICalls) => {
  logHeader('Verifying API Synchronization');
  
  // Group routes by base path
  const backendRouteMap = {};
  backendRoutes.forEach(route => {
    const key = route.baseRoute || 'root';
    backendRouteMap[key] = backendRouteMap[key] || [];
    backendRouteMap[key].push(route);
  });
  
  // Check frontend calls against backend routes
  const missingEndpoints = [];
  frontendAPICalls.forEach(apiCall => {
    const key = apiCall.baseRoute || 'root';
    const matchingRoutes = backendRouteMap[key] || [];
    
    // Consider it a match if the base route exists in backend
    if (matchingRoutes.length === 0) {
      missingEndpoints.push(apiCall);
    }
  });
  
  // Report results
  if (missingEndpoints.length === 0) {
    logSuccess('All frontend API calls have matching backend routes');
  } else {
    logWarning(`Found ${missingEndpoints.length} frontend API calls without matching backend routes`);
    
    missingEndpoints.forEach(endpoint => {
      logError(`${endpoint.method} ${endpoint.path} in ${endpoint.file} has no matching backend route`);
    });
  }
  
  // Also check for unused backend routes (optional)
  const frontendRouteMap = {};
  frontendAPICalls.forEach(apiCall => {
    const key = apiCall.baseRoute || 'root';
    frontendRouteMap[key] = frontendRouteMap[key] || [];
    frontendRouteMap[key].push(apiCall);
  });
  
  const unusedRoutes = [];
  backendRoutes.forEach(route => {
    const key = route.baseRoute || 'root';
    const matchingCalls = frontendRouteMap[key] || [];
    
    // Consider it unused if the base route doesn't exist in frontend calls
    if (matchingCalls.length === 0) {
      unusedRoutes.push(route);
    }
  });
  
  if (unusedRoutes.length === 0) {
    logSuccess('All backend routes are used by frontend API calls');
  } else {
    logInfo(`Found ${unusedRoutes.length} backend routes not used in frontend (may be admin or internal APIs)`);
    
    // Only show the first 10 unused routes to avoid overwhelming output
    unusedRoutes.slice(0, 10).forEach(route => {
      logInfo(`${route.method} ${route.path} in ${route.file} has no matching frontend API call`);
    });
    
    if (unusedRoutes.length > 10) {
      logInfo(`... and ${unusedRoutes.length - 10} more`);
    }
  }
};

// Main execution
const main = () => {
  logHeader('API SYNCHRONIZATION VERIFICATION');
  
  // Extract routes and API calls
  const backendRoutes = extractBackendRoutes();
  const frontendAPICalls = extractFrontendAPICalls();
  
  // Verify synchronization
  verifyAPISynchronization(backendRoutes, frontendAPICalls);
  
  logHeader('VERIFICATION COMPLETE');
};

// Run the script
main(); 