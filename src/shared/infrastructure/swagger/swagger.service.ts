import express, { Application, Request, Response } from 'express';
// @ts-expect-error - Import swagger-ui-express without type definitions
import * as swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger.config';

/**
 * Swagger Service for API documentation
 */
export class SwaggerService {
  /**
   * Sets up Swagger documentation endpoints
   * @param app Express application instance
   * @param basePath Base path for Swagger UI (default: '/api/docs')
   */
  public static setup(app: Application, basePath: string = '/api/docs'): void {
    // Serve Swagger UI
    app.use(
      basePath,
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'API Documentation | Keven Backend Template',
        customfavIcon: '/favicon.ico',
        swaggerOptions: {
          persistAuthorization: true,
        },
      })
    );

    // Serve Swagger JSON
    app.get(`${basePath}.json`, (req: Request, res: Response) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });

    console.log(`📚 Swagger documentation available at ${basePath}`);
    console.log(`📄 Swagger JSON available at ${basePath}.json`);
  }
}
