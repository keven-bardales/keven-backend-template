import request from 'supertest';
import { Application } from 'express';
import { TestSetup } from './test-setup';
import { Server } from '../../api/server';

describe('API Integration Tests', () => {
  let server: Server;
  let app: Application;

  beforeAll(async () => {
    server = await TestSetup.initialize();
    app = server.getApp();
  });

  afterAll(async () => {
    await TestSetup.cleanup();
  });

  describe('GET /', () => {
    it('should return API information', async () => {
      const response = await request(app).get('/').expect(200);

      expect(response.body).toMatchObject({
        status: 'success',
        statusCode: 200,
        message: 'Server is running successfully',
        data: {
          name: 'Keven Backend Template',
          version: expect.any(String),
          status: 'running',
          environment: expect.any(String),
          timestamp: expect.any(String),
          endpoints: {
            api: '/api',
            health: '/api/health',
            docs: '/api/docs',
          },
        },
      });
    });

    it('should have proper response headers', async () => {
      const response = await request(app).get('/');

      // Check security headers
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['referrer-policy']).toBe('no-referrer');

      // Check content type
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('GET /api', () => {
    it('should return API root information', async () => {
      const response = await request(app).get('/api').expect(200);

      expect(response.body).toMatchObject({
        status: 'success',
        statusCode: 200,
        message: 'API information retrieved successfully',
        data: {
          name: 'Keven Backend Template',
          version: expect.any(String),
          description: 'Clean Architecture Node.js Backend Template',
          documentation: '/api/docs',
          endpoints: {
            health: '/api/health',
            users: '/api/users',
            auth: '/api/auth',
            roles: '/api/rbac/roles',
          },
        },
      });
    });

    it('should include rate limiting headers', async () => {
      const response = await request(app).get('/api');

      // Check for rate limiting headers
      expect(response.headers).toHaveProperty('ratelimit-limit');
      expect(response.headers).toHaveProperty('ratelimit-remaining');
      expect(response.headers).toHaveProperty('ratelimit-reset');
    });
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/api/health').expect(200);

      expect(response.body).toMatchObject({
        status: 'success',
        statusCode: 200,
        message: 'Service is healthy',
        data: {
          status: 'healthy',
          timestamp: expect.any(String),
          version: expect.any(String),
          environment: expect.any(String),
        },
      });

      // Verify timestamp is recent (within last 5 seconds)
      const timestamp = new Date(response.body.data.timestamp);
      const now = new Date();
      const timeDiff = now.getTime() - timestamp.getTime();
      expect(timeDiff).toBeLessThan(5000);
    });

    it('should respond quickly for health checks', async () => {
      const startTime = Date.now();

      await request(app).get('/api/health').expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Health check should respond in under 1 second
      expect(responseTime).toBeLessThan(1000);
    });
  });

  describe('GET /api/docs', () => {
    it('should serve Swagger documentation', async () => {
      const response = await request(app).get('/api/docs').expect(200);

      // Should return HTML for Swagger UI
      expect(response.headers['content-type']).toMatch(/text\/html/);
      expect(response.text).toContain('swagger-ui');
    });

    it('should serve Swagger JSON specification', async () => {
      const response = await request(app).get('/api/docs.json').expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toMatchObject({
        openapi: '3.0.0',
        info: {
          title: 'Keven Backend Template API',
          version: '1.0.0',
          description: 'A modern TypeScript backend with clean architecture',
        },
        servers: expect.any(Array),
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent endpoints', async () => {
      const response = await request(app).get('/api/non-existent-endpoint').expect(404);

      expect(response.body).toMatchObject({
        status: 'error',
        statusCode: 404,
      });
    });

    it('should handle invalid HTTP methods', async () => {
      const response = await request(app)
        .patch('/api/health') // PATCH is not allowed on health endpoint
        .expect(404);

      expect(response.body).toMatchObject({
        status: 'error',
        statusCode: 404,
      });
    });

    it('should handle malformed JSON in request body', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}') // Malformed JSON
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.statusCode).toBe(400);
    });

    it('should handle requests with invalid content type', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'text/plain')
        .send('invalid data')
        .expect(400);

      expect(response.body.status).toBe('error');
    });
  });

  describe('Security Headers', () => {
    it('should include all required security headers', async () => {
      const response = await request(app).get('/api/health');

      const securityHeaders = {
        'x-frame-options': 'DENY',
        'x-content-type-options': 'nosniff',
        'x-xss-protection': '1; mode=block',
        'strict-transport-security': expect.stringContaining('max-age=31536000'),
        'referrer-policy': 'no-referrer',
        'cross-origin-embedder-policy': 'require-corp',
        'cross-origin-opener-policy': 'same-origin',
        'cross-origin-resource-policy': 'cross-origin',
      };

      Object.entries(securityHeaders).forEach(([header, expectedValue]) => {
        expect(response.headers[header]).toBeDefined();
        if (typeof expectedValue === 'string' && !expectedValue.includes('expect.')) {
          expect(response.headers[header]).toBe(expectedValue);
        }
      });
    });

    it('should hide server information', async () => {
      const response = await request(app).get('/api/health');

      expect(response.headers['x-powered-by']).toBeUndefined();
      expect(response.headers['server']).toBe('Keven-Backend');
    });

    it('should include cache control headers for API endpoints', async () => {
      const response = await request(app).get('/api/health');

      expect(response.headers['cache-control']).toContain('no-store');
      expect(response.headers['cache-control']).toContain('no-cache');
    });
  });

  describe('Rate Limiting', () => {
    it('should apply general rate limiting to API endpoints', async () => {
      // Make multiple rapid requests
      const requests = Array(5)
        .fill(null)
        .map(() => request(app).get('/api/health'));

      const responses = await Promise.all(requests);

      // All requests should succeed initially
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.headers).toHaveProperty('ratelimit-limit');
        expect(response.headers).toHaveProperty('ratelimit-remaining');
        expect(response.headers).toHaveProperty('ratelimit-reset');
      });
    });

    it('should have different rate limits for auth endpoints', async () => {
      const authResponse = await request(app).get('/api/auth/health');

      const generalResponse = await request(app).get('/api/health');

      // Auth endpoints should have stricter rate limiting
      const authLimit = parseInt(authResponse.headers['ratelimit-limit']);
      const generalLimit = parseInt(generalResponse.headers['ratelimit-limit']);

      expect(authLimit).toBeLessThanOrEqual(generalLimit);
    });
  });

  describe('CORS Configuration', () => {
    it('should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/api/health')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Headers', 'Content-Type,Authorization')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toBeDefined();
      expect(response.headers['access-control-allow-headers']).toBeDefined();
    });

    it('should include CORS headers in API responses', async () => {
      const response = await request(app).get('/api/health').set('Origin', 'http://localhost:3000');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });
});
