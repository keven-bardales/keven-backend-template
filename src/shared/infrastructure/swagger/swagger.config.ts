// @ts-expect-error - Import swagger-jsdoc without type definitions
import swaggerJSDoc from 'swagger-jsdoc';

/**
 * Swagger definition options
 */
const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Keven Backend Template API',
      version: '1.0.0',
      description: 'A modern TypeScript backend with clean architecture',
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC',
      },
      contact: {
        name: 'Keven Bardales',
        url: 'https://github.com/keven-bardales',
      },
    },
    servers: [
      {
        url: '/api',
        description: 'Development API server',
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
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/modules/**/infrastructure/routes/*.routes.ts', './src/api/routes/*.ts'],
};

/**
 * Swagger specification
 */
export const swaggerSpec = swaggerJSDoc(options);
