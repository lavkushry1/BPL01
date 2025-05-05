import { Router } from 'express';
import { logger } from './logger';

/**
 * Register multiple routes with a common prefix
 * @param app Express Router instance
 * @param routes Object mapping route paths to router instances
 * @param prefix Optional prefix to prepend to all routes
 */
export const registerRoutes = (app: Router, routes: Record<string, Router>, prefix: string = '') => {
  Object.entries(routes).forEach(([path, router]) => {
    const fullPath = prefix ? `${prefix}/${path}` : `/${path}`;
    app.use(fullPath, router);
    logger.info(`Registered route: ${fullPath}`);
  });
};

/**
 * Map all registered routes for documentation purposes
 * @param app Express application instance
 * @returns Array of route strings in format METHOD /path
 */
export const mapRoutes = (app: any) => {
  const routes: string[] = [];

  if (app._router && app._router.stack) {
    const extractRoutes = (stack: any[], basePath: string = '') => {
      stack.forEach(middleware => {
        if (middleware.route) {
          // It's a route definition
          const path = basePath + middleware.route.path;
          const methods = Object.keys(middleware.route.methods)
            .filter(method => middleware.route.methods[method])
            .map(method => method.toUpperCase());
          routes.push(`${methods.join(',')} ${path}`);
        } else if (middleware.name === 'router' && middleware.handle.stack) {
          // It's a nested router
          const path = middleware.regexp.source
            .replace('^\\/', '/')
            .replace('\\/?(?=\\/|$)', '')
            .replace(/\\\//g, '/');
          
          let routePath = basePath;
          if (path !== '(?:/(?=$))?') {
            routePath = path.replace(/\(\?:\/\(\?=\/\|\$\)\)\?$/, '');
          }
          
          extractRoutes(middleware.handle.stack, routePath);
        }
      });
    };

    extractRoutes(app._router.stack);
  }

  return routes;
};

/**
 * Generate route documentation
 * @param app Express application instance
 * @returns Markdown formatted route documentation
 */
export const generateRouteDocumentation = (app: any): string => {
  const routes = mapRoutes(app);
  
  // Group routes by resource
  const resourceGroups: Record<string, string[]> = {};
  
  routes.forEach(route => {
    const [methods, path] = route.split(' ');
    const segments = path.split('/').filter(Boolean);
    const resource = segments.length > 0 ? segments[0] : 'root';
    
    if (!resourceGroups[resource]) {
      resourceGroups[resource] = [];
    }
    
    resourceGroups[resource].push(route);
  });
  
  // Generate markdown
  let markdown = '# API Routes Documentation\n\n';
  
  Object.entries(resourceGroups).forEach(([resource, routes]) => {
    markdown += `## ${resource.toUpperCase()}\n\n`;
    
    routes.forEach(route => {
      const [methods, path] = route.split(' ');
      markdown += `- \`${methods}\` \`${path}\`\n`;
    });
    
    markdown += '\n';
  });
  
  return markdown;
}; 