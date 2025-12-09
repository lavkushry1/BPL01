
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';
import swaggerOptions from '../config/swagger';

// Generate Swagger specification
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Setup Swagger documentation route
export const setupSwagger = (app: Application): void => {
  // Serve Swagger API docs
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  
  // Expose OpenAPI spec as JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};
