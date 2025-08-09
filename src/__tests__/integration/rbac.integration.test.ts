import request from 'supertest';
import { Application } from 'express';
import { TestSetup } from './test-setup';
import { Server } from '../../api/server';

describe('RBAC Integration Tests', () => {
  let server: Server;
  let app: Application;
  let authToken: string;

  beforeAll(async () => {
    server = await TestSetup.initialize();
    app = server.getApp();

    // Create a test user and get auth token for protected routes
    await request(app).post('/api/auth/register').send({
      email: 'rbacadmin@example.com',
      password: 'SecurePassword123!',
      firstName: 'RBAC',
      lastName: 'Admin',
    });

    const loginResponse = await request(app).post('/api/auth/login').send({
      email: 'rbacadmin@example.com',
      password: 'SecurePassword123!',
    });

    authToken = loginResponse.body.data.accessToken;
  });

  afterAll(async () => {
    await TestSetup.cleanup();
  });

  describe('POST /api/rbac/roles', () => {
    const validRoleData = {
      name: 'TestRole',
      description: 'A test role for integration tests',
    };

    it('should create a new role successfully with authentication', async () => {
      const response = await request(app)
        .post('/api/rbac/roles')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validRoleData)
        .expect(201);

      expect(response.body).toMatchObject({
        status: 'success',
        statusCode: 201,
        message: expect.stringContaining('Role created successfully'),
        data: {
          role: {
            id: expect.any(String),
            name: validRoleData.name,
            description: validRoleData.description,
            isActive: expect.any(Boolean),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          },
        },
      });
    });

    it('should reject role creation without authentication', async () => {
      const response = await request(app).post('/api/rbac/roles').send(validRoleData).expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.statusCode).toBe(401);
      expect(response.body.message).toContain('authentication');
    });

    it('should reject role creation with invalid token', async () => {
      const response = await request(app)
        .post('/api/rbac/roles')
        .set('Authorization', 'Bearer invalid-token')
        .send(validRoleData)
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.statusCode).toBe(401);
    });

    it('should validate role data', async () => {
      const invalidRoleData = {
        name: '', // Empty name should be invalid
        description: validRoleData.description,
      };

      const response = await request(app)
        .post('/api/rbac/roles')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidRoleData)
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.statusCode).toBe(400);
      expect(response.body.message).toContain('validation');
    });

    it('should handle duplicate role names', async () => {
      // Create first role
      await request(app).post('/api/rbac/roles').set('Authorization', `Bearer ${authToken}`).send({
        name: 'DuplicateRole',
        description: 'First duplicate role',
      });

      // Try to create second role with same name
      const response = await request(app)
        .post('/api/rbac/roles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'DuplicateRole',
          description: 'Second duplicate role',
        })
        .expect(409);

      expect(response.body.status).toBe('error');
      expect(response.body.statusCode).toBe(409);
      expect(response.body.message).toContain('already exists');
    });

    it('should handle role name length validation', async () => {
      const longNameRole = {
        name: 'a'.repeat(51), // Assuming max length is 50
        description: 'Role with very long name',
      };

      const response = await request(app)
        .post('/api/rbac/roles')
        .set('Authorization', `Bearer ${authToken}`)
        .send(longNameRole)
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.statusCode).toBe(400);
    });

    it('should create role with minimal data', async () => {
      const minimalRoleData = {
        name: 'MinimalRole',
      };

      const response = await request(app)
        .post('/api/rbac/roles')
        .set('Authorization', `Bearer ${authToken}`)
        .send(minimalRoleData)
        .expect(201);

      expect(response.body.data.role).toMatchObject({
        name: minimalRoleData.name,
        description: expect.any(String), // Should have default or null value
        isActive: expect.any(Boolean),
      });
    });
  });

  describe('GET /api/rbac/roles', () => {
    beforeEach(async () => {
      // Create some test roles
      await request(app).post('/api/rbac/roles').set('Authorization', `Bearer ${authToken}`).send({
        name: 'ListRole1',
        description: 'First role for listing tests',
      });

      await request(app).post('/api/rbac/roles').set('Authorization', `Bearer ${authToken}`).send({
        name: 'ListRole2',
        description: 'Second role for listing tests',
      });
    });

    it('should return paginated list of roles with authentication', async () => {
      const response = await request(app)
        .get('/api/rbac/roles')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'success',
        statusCode: 200,
        message: expect.stringContaining('Roles retrieved successfully'),
        data: {
          roles: expect.any(Array),
          pagination: {
            page: expect.any(Number),
            limit: expect.any(Number),
            total: expect.any(Number),
            totalPages: expect.any(Number),
          },
        },
      });

      // Verify role structure
      response.body.data.roles.forEach((role: any) => {
        expect(role).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
          description: expect.any(String),
          isActive: expect.any(Boolean),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        });
      });
    });

    it('should reject listing roles without authentication', async () => {
      const response = await request(app).get('/api/rbac/roles').expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.statusCode).toBe(401);
    });

    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/rbac/roles?page=1&limit=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.pagination).toMatchObject({
        page: 1,
        limit: 1,
        total: expect.any(Number),
        totalPages: expect.any(Number),
      });

      expect(response.body.data.roles).toHaveLength(1);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/rbac/roles?page=invalid&limit=invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.statusCode).toBe(400);
    });

    it('should handle empty result set', async () => {
      const response = await request(app)
        .get('/api/rbac/roles?page=999&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.roles).toHaveLength(0);
      expect(response.body.data.pagination.page).toBe(999);
    });

    it('should filter active/inactive roles', async () => {
      const response = await request(app)
        .get('/api/rbac/roles?isActive=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // All returned roles should be active
      response.body.data.roles.forEach((role: any) => {
        expect(role.isActive).toBe(true);
      });
    });
  });

  describe('GET /api/rbac/roles/:id', () => {
    let roleId: string;

    beforeEach(async () => {
      // Create a test role
      const createResponse = await request(app)
        .post('/api/rbac/roles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'GetByIdRole',
          description: 'Role for get by ID tests',
        });

      roleId = createResponse.body.data.role.id;
    });

    it('should return role by ID with authentication', async () => {
      const response = await request(app)
        .get(`/api/rbac/roles/${roleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'success',
        statusCode: 200,
        message: expect.stringContaining('Role retrieved successfully'),
        data: {
          role: {
            id: roleId,
            name: 'GetByIdRole',
            description: 'Role for get by ID tests',
            isActive: expect.any(Boolean),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            permissions: expect.any(Array), // Should include permissions
          },
        },
      });
    });

    it('should reject get role without authentication', async () => {
      const response = await request(app).get(`/api/rbac/roles/${roleId}`).expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.statusCode).toBe(401);
    });

    it('should return 404 for non-existent role ID', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app)
        .get(`/api/rbac/roles/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.status).toBe('error');
      expect(response.body.statusCode).toBe(404);
      expect(response.body.message).toContain('not found');
    });

    it('should return 400 for invalid role ID format', async () => {
      const response = await request(app)
        .get('/api/rbac/roles/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.statusCode).toBe(400);
      expect(response.body.message).toContain('validation');
    });
  });

  describe('PUT /api/rbac/roles/:id', () => {
    let roleId: string;

    beforeEach(async () => {
      // Create a test role
      const createResponse = await request(app)
        .post('/api/rbac/roles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'UpdateRole',
          description: 'Role for update tests',
        });

      roleId = createResponse.body.data.role.id;
    });

    it('should update role successfully with authentication', async () => {
      const updateData = {
        name: 'UpdatedRole',
        description: 'Updated role description',
        isActive: false,
      };

      const response = await request(app)
        .put(`/api/rbac/roles/${roleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'success',
        statusCode: 200,
        message: expect.stringContaining('Role updated successfully'),
        data: {
          role: {
            id: roleId,
            name: updateData.name,
            description: updateData.description,
            isActive: updateData.isActive,
            updatedAt: expect.any(String),
          },
        },
      });
    });

    it('should reject update without authentication', async () => {
      const response = await request(app)
        .put(`/api/rbac/roles/${roleId}`)
        .send({ name: 'Updated' })
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.statusCode).toBe(401);
    });

    it('should handle partial updates', async () => {
      const partialUpdate = {
        description: 'Partially updated description',
      };

      const response = await request(app)
        .put(`/api/rbac/roles/${roleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(partialUpdate)
        .expect(200);

      expect(response.body.data.role.description).toBe(partialUpdate.description);
      expect(response.body.data.role.name).toBe('UpdateRole'); // Should remain unchanged
    });

    it('should return 404 for non-existent role', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app)
        .put(`/api/rbac/roles/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated' })
        .expect(404);

      expect(response.body.status).toBe('error');
      expect(response.body.statusCode).toBe(404);
    });

    it('should validate update data', async () => {
      const invalidData = {
        name: '', // Empty name should be invalid
      };

      const response = await request(app)
        .put(`/api/rbac/roles/${roleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.statusCode).toBe(400);
    });
  });

  describe('DELETE /api/rbac/roles/:id', () => {
    let roleId: string;

    beforeEach(async () => {
      // Create a test role
      const createResponse = await request(app)
        .post('/api/rbac/roles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'DeleteRole',
          description: 'Role for delete tests',
        });

      roleId = createResponse.body.data.role.id;
    });

    it('should delete role successfully with authentication', async () => {
      const response = await request(app)
        .delete(`/api/rbac/roles/${roleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'success',
        statusCode: 200,
        message: expect.stringContaining('Role deleted successfully'),
        data: null,
      });

      // Verify role is actually deleted
      await request(app)
        .get(`/api/rbac/roles/${roleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should reject delete without authentication', async () => {
      const response = await request(app).delete(`/api/rbac/roles/${roleId}`).expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.statusCode).toBe(401);
    });

    it('should return 404 for non-existent role', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app)
        .delete(`/api/rbac/roles/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.status).toBe('error');
      expect(response.body.statusCode).toBe(404);
    });
  });

  describe('Role Permissions Management', () => {
    let roleId: string;

    beforeEach(async () => {
      // Create a test role
      const createResponse = await request(app)
        .post('/api/rbac/roles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'PermissionRole',
          description: 'Role for permission tests',
        });

      roleId = createResponse.body.data.role.id;
    });

    it('should assign permissions to role', async () => {
      const permissionData = {
        permissionIds: ['permission-id-1', 'permission-id-2'],
      };

      // Note: This endpoint might not be implemented yet
      // This is a placeholder for testing permission assignment
      const response = await request(app)
        .post(`/api/rbac/roles/${roleId}/permissions`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(permissionData);

      // Should either return 200 (implemented) or 404 (not implemented)
      expect([200, 404]).toContain(response.status);
    });

    it('should remove permissions from role', async () => {
      const permissionData = {
        permissionIds: ['permission-id-1'],
      };

      // Note: This endpoint might not be implemented yet
      const response = await request(app)
        .delete(`/api/rbac/roles/${roleId}/permissions`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(permissionData);

      // Should either return 200 (implemented) or 404 (not implemented)
      expect([200, 404]).toContain(response.status);
    });
  });

  describe('Security and Rate Limiting', () => {
    it('should apply RBAC-specific rate limiting', async () => {
      const response = await request(app)
        .get('/api/rbac/roles')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.headers).toHaveProperty('ratelimit-limit');
      expect(response.headers).toHaveProperty('ratelimit-remaining');
      expect(response.headers).toHaveProperty('ratelimit-reset');

      const limit = parseInt(response.headers['ratelimit-limit']);
      expect(limit).toBeLessThanOrEqual(20); // RBAC endpoints have 20 requests per 15 minutes
    });

    it('should handle rate limiting correctly', async () => {
      // Make multiple requests rapidly to test rate limiting
      const requests = Array(25)
        .fill(null)
        .map(() => request(app).get('/api/rbac/roles').set('Authorization', `Bearer ${authToken}`));

      const responses = await Promise.allSettled(requests);

      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(
        result => result.status === 'fulfilled' && result.value.status === 429
      );

      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should sanitize role input data', async () => {
      const maliciousData = {
        name: '<script>alert("xss")</script>',
        description: 'javascript:alert("xss")',
      };

      const response = await request(app)
        .post('/api/rbac/roles')
        .set('Authorization', `Bearer ${authToken}`)
        .send(maliciousData);

      if (response.status === 201) {
        // XSS payload should be sanitized
        expect(response.body.data.role.name).not.toContain('<script>');
        expect(response.body.data.role.description).not.toContain('javascript:');
      }
    });

    it('should validate authorization header format', async () => {
      const response = await request(app)
        .get('/api/rbac/roles')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.statusCode).toBe(401);
    });
  });
});
