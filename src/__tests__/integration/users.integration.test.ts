import request from 'supertest';
import { Application } from 'express';
import { TestSetup } from './test-setup';
import { Server } from '../../api/server';

describe('Users Integration Tests', () => {
  let server: Server;
  let app: Application;

  beforeAll(async () => {
    server = await TestSetup.initialize();
    app = server.getApp();
  });

  afterAll(async () => {
    await TestSetup.cleanup();
  });

  describe('POST /api/users', () => {
    const validUserData = {
      email: 'newuser@example.com',
      password: 'SecurePassword123!',
      firstName: 'New',
      lastName: 'User',
      isActive: true,
      mustChangePassword: false,
    };

    it('should create a new user successfully', async () => {
      const response = await request(app).post('/api/users').send(validUserData).expect(201);

      expect(response.body).toMatchObject({
        status: 'success',
        statusCode: 201,
        message: expect.stringContaining('User created successfully'),
        data: {
          user: {
            id: expect.any(String),
            email: validUserData.email,
            firstName: validUserData.firstName,
            lastName: validUserData.lastName,
            isActive: validUserData.isActive,
            mustChangePassword: validUserData.mustChangePassword,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          },
        },
      });

      // Password should not be returned
      expect(response.body.data.user).not.toHaveProperty('password');
      expect(response.body.data.user).not.toHaveProperty('passwordHash');
    });

    it('should create user with minimal required fields', async () => {
      const minimalData = {
        email: 'minimal@example.com',
        password: 'SecurePassword123!',
        firstName: 'Min',
        lastName: 'User',
      };

      const response = await request(app).post('/api/users').send(minimalData).expect(201);

      expect(response.body.data.user).toMatchObject({
        email: minimalData.email,
        firstName: minimalData.firstName,
        lastName: minimalData.lastName,
        // Should have default values
        isActive: expect.any(Boolean),
        mustChangePassword: expect.any(Boolean),
      });
    });

    it('should reject user creation with invalid email', async () => {
      const invalidData = { ...validUserData, email: 'invalid-email' };

      const response = await request(app).post('/api/users').send(invalidData).expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.statusCode).toBe(400);
      expect(response.body.message).toContain('validation');
    });

    it('should reject user creation with weak password', async () => {
      const invalidData = { ...validUserData, password: 'weak' };

      const response = await request(app).post('/api/users').send(invalidData).expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.statusCode).toBe(400);
    });

    it('should reject user creation with missing required fields', async () => {
      const invalidData = {
        email: 'incomplete@example.com',
        // missing password, firstName, lastName
      };

      const response = await request(app).post('/api/users').send(invalidData).expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.statusCode).toBe(400);
    });

    it('should handle duplicate email addresses', async () => {
      // Create first user
      await request(app).post('/api/users').send({
        email: 'duplicate@example.com',
        password: 'SecurePassword123!',
        firstName: 'First',
        lastName: 'User',
      });

      // Try to create second user with same email
      const response = await request(app)
        .post('/api/users')
        .send({
          email: 'duplicate@example.com',
          password: 'SecurePassword123!',
          firstName: 'Second',
          lastName: 'User',
        })
        .expect(409);

      expect(response.body.status).toBe('error');
      expect(response.body.statusCode).toBe(409);
      expect(response.body.message).toContain('already exists');
    });

    it('should apply rate limiting to user creation', async () => {
      // Make multiple requests rapidly
      const requests = Array(35)
        .fill(null)
        .map((_, index) =>
          request(app)
            .post('/api/users')
            .send({
              email: `ratelimit${index}@example.com`,
              password: 'SecurePassword123!',
              firstName: 'Rate',
              lastName: 'Limit',
            })
        );

      const responses = await Promise.allSettled(requests);

      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(
        result => result.status === 'fulfilled' && result.value.status === 429
      );

      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/users', () => {
    beforeEach(async () => {
      // Create some test users
      await request(app).post('/api/users').send({
        email: 'listuser1@example.com',
        password: 'SecurePassword123!',
        firstName: 'List',
        lastName: 'User1',
      });

      await request(app).post('/api/users').send({
        email: 'listuser2@example.com',
        password: 'SecurePassword123!',
        firstName: 'List',
        lastName: 'User2',
      });
    });

    it('should return paginated list of users', async () => {
      const response = await request(app).get('/api/users').expect(200);

      expect(response.body).toMatchObject({
        status: 'success',
        statusCode: 200,
        message: expect.stringContaining('Users retrieved successfully'),
        data: {
          users: expect.any(Array),
          pagination: {
            page: expect.any(Number),
            limit: expect.any(Number),
            total: expect.any(Number),
            totalPages: expect.any(Number),
          },
        },
      });

      // Users should not contain password information
      response.body.data.users.forEach((user: any) => {
        expect(user).not.toHaveProperty('password');
        expect(user).not.toHaveProperty('passwordHash');
        expect(user).toMatchObject({
          id: expect.any(String),
          email: expect.any(String),
          firstName: expect.any(String),
          lastName: expect.any(String),
          isActive: expect.any(Boolean),
          createdAt: expect.any(String),
        });
      });
    });

    it('should handle pagination parameters', async () => {
      const response = await request(app).get('/api/users?page=1&limit=1').expect(200);

      expect(response.body.data.pagination).toMatchObject({
        page: 1,
        limit: 1,
        total: expect.any(Number),
        totalPages: expect.any(Number),
      });

      expect(response.body.data.users).toHaveLength(1);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app).get('/api/users?page=invalid&limit=invalid').expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.statusCode).toBe(400);
    });

    it('should handle empty result set', async () => {
      // Create a query that returns no results
      const response = await request(app).get('/api/users?page=999&limit=10').expect(200);

      expect(response.body.data.users).toHaveLength(0);
      expect(response.body.data.pagination.page).toBe(999);
    });
  });

  describe('GET /api/users/:id', () => {
    let userId: string;

    beforeEach(async () => {
      // Create a test user
      const createResponse = await request(app).post('/api/users').send({
        email: 'getbyid@example.com',
        password: 'SecurePassword123!',
        firstName: 'GetById',
        lastName: 'User',
      });

      userId = createResponse.body.data.user.id;
    });

    it('should return user by ID', async () => {
      const response = await request(app).get(`/api/users/${userId}`).expect(200);

      expect(response.body).toMatchObject({
        status: 'success',
        statusCode: 200,
        message: expect.stringContaining('User retrieved successfully'),
        data: {
          id: userId,
          email: 'getbyid@example.com',
          firstName: 'GetById',
          lastName: 'User',
          isActive: expect.any(Boolean),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      });

      // Should not contain password
      expect(response.body.data).not.toHaveProperty('password');
      expect(response.body.data).not.toHaveProperty('passwordHash');
    });

    it('should return 404 for non-existent user ID', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app).get(`/api/users/${nonExistentId}`).expect(404);

      expect(response.body.status).toBe('error');
      expect(response.body.statusCode).toBe(404);
      expect(response.body.message).toContain('not found');
    });

    it('should return 400 for invalid user ID format', async () => {
      const response = await request(app).get('/api/users/invalid-id').expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.statusCode).toBe(400);
      expect(response.body.message).toContain('validation');
    });
  });

  describe('PUT /api/users/:id', () => {
    let userId: string;

    beforeEach(async () => {
      // Create a test user
      const createResponse = await request(app).post('/api/users').send({
        email: 'update@example.com',
        password: 'SecurePassword123!',
        firstName: 'Update',
        lastName: 'User',
      });

      userId = createResponse.body.data.user.id;
    });

    it('should update user successfully', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        isActive: false,
      };

      const response = await request(app).put(`/api/users/${userId}`).send(updateData).expect(200);

      expect(response.body).toMatchObject({
        status: 'success',
        statusCode: 200,
        message: expect.stringContaining('User updated successfully'),
        data: {
          id: userId,
          email: 'update@example.com', // Should remain unchanged
          firstName: updateData.firstName,
          lastName: updateData.lastName,
          isActive: updateData.isActive,
          updatedAt: expect.any(String),
        },
      });
    });

    it('should handle partial updates', async () => {
      const partialUpdate = {
        firstName: 'PartiallyUpdated',
      };

      const response = await request(app)
        .put(`/api/users/${userId}`)
        .send(partialUpdate)
        .expect(200);

      expect(response.body.data.firstName).toBe(partialUpdate.firstName);
      expect(response.body.data.lastName).toBe('User'); // Should remain unchanged
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app)
        .put(`/api/users/${nonExistentId}`)
        .send({ firstName: 'Updated' })
        .expect(404);

      expect(response.body.status).toBe('error');
      expect(response.body.statusCode).toBe(404);
    });

    it('should validate update data', async () => {
      const invalidData = {
        email: 'invalid-email-format',
        firstName: '', // Empty string should be invalid
      };

      const response = await request(app).put(`/api/users/${userId}`).send(invalidData).expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.statusCode).toBe(400);
    });
  });

  describe('DELETE /api/users/:id', () => {
    let userId: string;

    beforeEach(async () => {
      // Create a test user
      const createResponse = await request(app).post('/api/users').send({
        email: 'delete@example.com',
        password: 'SecurePassword123!',
        firstName: 'Delete',
        lastName: 'User',
      });

      userId = createResponse.body.data.user.id;
    });

    it('should delete user successfully', async () => {
      const response = await request(app).delete(`/api/users/${userId}`).expect(200);

      expect(response.body).toMatchObject({
        status: 'success',
        statusCode: 200,
        message: expect.stringContaining('User deleted successfully'),
        data: null,
      });

      // Verify user is actually deleted
      await request(app).get(`/api/users/${userId}`).expect(404);
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app).delete(`/api/users/${nonExistentId}`).expect(404);

      expect(response.body.status).toBe('error');
      expect(response.body.statusCode).toBe(404);
    });

    it('should validate user ID format', async () => {
      const response = await request(app).delete('/api/users/invalid-id').expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.statusCode).toBe(400);
    });
  });

  describe('Security and Validation', () => {
    it('should apply user-specific rate limiting', async () => {
      const response = await request(app).get('/api/users');

      expect(response.headers).toHaveProperty('ratelimit-limit');
      expect(response.headers).toHaveProperty('ratelimit-remaining');
      expect(response.headers).toHaveProperty('ratelimit-reset');

      const limit = parseInt(response.headers['ratelimit-limit']);
      expect(limit).toBeLessThanOrEqual(30); // User endpoints have 30 requests per 15 minutes
    });

    it('should sanitize user input', async () => {
      const maliciousData = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        firstName: '<script>alert("xss")</script>',
        lastName: 'User',
      };

      const response = await request(app).post('/api/users').send(maliciousData).expect(201);

      // XSS payload should be sanitized or rejected
      expect(response.body.data.user.firstName).not.toContain('<script>');
    });

    it('should handle large request bodies appropriately', async () => {
      const largeString = 'a'.repeat(100000); // 100KB string

      const response = await request(app)
        .post('/api/users')
        .send({
          email: 'large@example.com',
          password: 'SecurePassword123!',
          firstName: largeString,
          lastName: 'User',
        })
        .expect(400);

      expect(response.body.status).toBe('error');
    });
  });
});
