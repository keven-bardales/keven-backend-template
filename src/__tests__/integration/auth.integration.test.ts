import request from 'supertest';
import { Application } from 'express';
import { TestSetup } from './test-setup';
import { Server } from '../../api/server';

describe('Auth Integration Tests', () => {
  let server: Server;
  let app: Application;

  beforeAll(async () => {
    server = await TestSetup.initialize();
    app = server.getApp();
  });

  afterAll(async () => {
    await TestSetup.cleanup();
  });

  describe('POST /api/auth/register', () => {
    const validRegistrationData = {
      email: 'test@example.com',
      password: 'SecurePassword123!',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegistrationData)
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'success',
        statusCode: 200,
        message: expect.stringContaining('Registration successful'),
        data: {
          id: expect.any(String),
          email: validRegistrationData.email,
          firstName: validRegistrationData.firstName,
          lastName: validRegistrationData.lastName,
          isActive: expect.any(Boolean),
          mustChangePassword: expect.any(Boolean),
          createdAt: expect.any(String),
        },
      });
    });

    it('should reject registration with invalid email', async () => {
      const invalidData = { ...validRegistrationData, email: 'invalid-email' };

      const response = await request(app).post('/api/auth/register').send(invalidData).expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.statusCode).toBe(400);
    });

    it('should reject registration with weak password', async () => {
      const invalidData = { ...validRegistrationData, password: '123' };

      const response = await request(app).post('/api/auth/register').send(invalidData).expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.statusCode).toBe(400);
    });

    it('should reject registration with missing required fields', async () => {
      const invalidData = { email: 'test2@example.com' };

      const response = await request(app).post('/api/auth/register').send(invalidData).expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.statusCode).toBe(400);
    });

    it('should handle rate limiting', async () => {
      // Make multiple requests to trigger rate limiting
      const requests = Array(12)
        .fill(null)
        .map((_, index) =>
          request(app)
            .post('/api/auth/register')
            .send({
              ...validRegistrationData,
              email: `test${index}@example.com`,
            })
        );

      const responses = await Promise.allSettled(requests);

      // At least one request should be rate limited
      const rateLimitedResponses = responses.filter(
        result => result.status === 'fulfilled' && result.value.status === 429
      );

      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/auth/login', () => {
    const loginCredentials = {
      email: 'login@example.com',
      password: 'SecurePassword123!',
    };

    beforeEach(async () => {
      // Register a user for login tests
      await request(app)
        .post('/api/auth/register')
        .send({
          ...loginCredentials,
          firstName: 'Login',
          lastName: 'User',
        });
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginCredentials)
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'success',
        statusCode: 200,
        message: expect.stringContaining('Authentication successful'),
        data: {
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
          user: {
            id: expect.any(String),
            email: loginCredentials.email,
            firstName: 'Login',
            lastName: 'User',
          },
        },
      });
    });

    it('should reject login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: loginCredentials.email,
          password: 'WrongPassword',
        })
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.statusCode).toBe(401);
    });

    it('should reject login with non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SomePassword123!',
        })
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.statusCode).toBe(401);
    });

    it('should validate request body format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          // missing password
        })
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.statusCode).toBe(400);
    });
  });

  describe('POST /api/auth/refresh', () => {
    let accessToken: string;
    let refreshToken: string;

    beforeEach(async () => {
      // Register and login to get tokens
      await request(app).post('/api/auth/register').send({
        email: 'refresh@example.com',
        password: 'SecurePassword123!',
        firstName: 'Refresh',
        lastName: 'User',
      });

      const loginResponse = await request(app).post('/api/auth/login').send({
        email: 'refresh@example.com',
        password: 'SecurePassword123!',
      });

      accessToken = loginResponse.body.data.accessToken;
      refreshToken = loginResponse.body.data.refreshToken;
    });

    it('should refresh tokens successfully with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'success',
        statusCode: 200,
        message: expect.stringContaining('Tokens refreshed successfully'),
        data: {
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        },
      });

      // New tokens should be different from original tokens
      expect(response.body.data.accessToken).not.toBe(accessToken);
      expect(response.body.data.refreshToken).not.toBe(refreshToken);
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.statusCode).toBe(401);
    });

    it('should validate request body', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({}) // missing refreshToken
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.statusCode).toBe(400);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app).post('/api/auth/logout').expect(200);

      expect(response.body).toMatchObject({
        status: 'success',
        statusCode: 200,
        message: expect.stringContaining('Logged out successfully'),
        data: null,
      });
    });
  });

  describe('POST /api/auth/logout-all', () => {
    it('should logout from all devices successfully', async () => {
      const response = await request(app).post('/api/auth/logout-all').expect(200);

      expect(response.body).toMatchObject({
        status: 'success',
        statusCode: 200,
        message: expect.stringContaining('Logged out from all devices'),
        data: null,
      });
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should get user profile', async () => {
      const response = await request(app).get('/api/auth/profile').expect(200);

      expect(response.body).toMatchObject({
        status: 'success',
        statusCode: 200,
        message: expect.stringContaining('Profile retrieved successfully'),
        data: expect.any(Object),
      });
    });
  });

  describe('POST /api/auth/validate', () => {
    it('should validate token successfully', async () => {
      const response = await request(app).post('/api/auth/validate').expect(200);

      expect(response.body).toMatchObject({
        status: 'success',
        statusCode: 200,
        message: expect.stringContaining('Token is valid'),
        data: {
          valid: true,
        },
      });
    });
  });

  describe('GET /api/auth/health', () => {
    it('should return auth service health', async () => {
      const response = await request(app).get('/api/auth/health').expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Auth service is healthy',
        timestamp: expect.any(String),
      });
    });
  });
});
