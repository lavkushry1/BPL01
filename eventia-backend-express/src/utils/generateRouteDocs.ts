import * as fs from 'fs';
import * as path from 'path';
import { createApp } from '../app';
import { generateRouteDocumentation } from './routeHelper';
import { logger } from './logger';

/**
 * Generate route documentation and save to file
 */
async function generateDocs() {
  try {
    logger.info('Starting route documentation generation');
    
    // Create Express app instance
    const { app } = await createApp();
    
    // Generate documentation
    const documentation = generateRouteDocumentation(app);
    
    // Save to file
    const docsPath = path.join(process.cwd(), 'API_ROUTES.md');
    fs.writeFileSync(docsPath, documentation);
    
    logger.info(`Route documentation saved to ${docsPath}`);
    process.exit(0);
  } catch (error) {
    logger.error('Error generating route documentation:', error);
    process.exit(1);
  }
}

// Only run when executed directly
if (require.main === module) {
  generateDocs();
}

export default generateDocs; 