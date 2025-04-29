
export default {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Eventia API',
      version: '1.0.0',
      description: 'API documentation for Eventia event management platform',
      license: {
        name: 'ISC',
      },
      contact: {
        name: 'API Support',
        email: 'support@eventia.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:4000/api/v1',
        description: 'Development server',
      },
      {
        url: 'https://api.eventia.com/api/v1',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    example: 'error',
                  },
                  statusCode: {
                    type: 'integer',
                    example: 401,
                  },
                  message: {
                    type: 'string',
                    example: 'Unauthorized',
                  },
                  code: {
                    type: 'string',
                    example: 'UNAUTHORIZED',
                  },
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Auth',
        description: 'Authentication endpoints',
      },
      {
        name: 'Events',
        description: 'Event management endpoints',
      },
      {
        name: 'Bookings',
        description: 'Ticket booking endpoints',
      },
      {
        name: 'Payments',
        description: 'Payment processing endpoints',
      },
      {
        name: 'Users',
        description: 'User management endpoints',
      },
    ],
  },
  apis: ['./src/routes/**/*.ts'],
};
