import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Create modules
    console.log('📦 Creating modules...');
    const authModule = await prisma.module.upsert({
      where: { name: 'auth' },
      update: {},
      create: {
        name: 'auth',
        description: 'Authentication and authorization module',
        isActive: true,
      },
    });

    const usersModule = await prisma.module.upsert({
      where: { name: 'users' },
      update: {},
      create: {
        name: 'users',
        description: 'User management module',
        isActive: true,
      },
    });

    const rbacModule = await prisma.module.upsert({
      where: { name: 'rbac' },
      update: {},
      create: {
        name: 'rbac',
        description: 'Role-based access control module',
        isActive: true,
      },
    });

    const systemModule = await prisma.module.upsert({
      where: { name: 'system' },
      update: {},
      create: {
        name: 'system',
        description: 'System administration module',
        isActive: true,
      },
    });

    console.log('✅ Modules created successfully');

    // Create permissions
    console.log('🔐 Creating permissions...');
    const permissions = [
      // Auth permissions
      { moduleId: authModule.id, action: 'login', scope: 'auth', name: 'Login', description: 'Ability to login to the system' },
      { moduleId: authModule.id, action: 'register', scope: 'auth', name: 'Register', description: 'Ability to register new accounts' },
      { moduleId: authModule.id, action: 'refresh', scope: 'auth', name: 'Refresh Token', description: 'Ability to refresh authentication tokens' },
      { moduleId: authModule.id, action: 'logout', scope: 'auth', name: 'Logout', description: 'Ability to logout from the system' },

      // User permissions
      { moduleId: usersModule.id, action: 'create', scope: 'user', name: 'Create User', description: 'Create new users' },
      { moduleId: usersModule.id, action: 'read', scope: 'user', name: 'Read User', description: 'View user details' },
      { moduleId: usersModule.id, action: 'update', scope: 'user', name: 'Update User', description: 'Update user information' },
      { moduleId: usersModule.id, action: 'delete', scope: 'user', name: 'Delete User', description: 'Delete users' },
      { moduleId: usersModule.id, action: 'list', scope: 'users', name: 'List Users', description: 'View list of users' },

      // RBAC permissions
      { moduleId: rbacModule.id, action: 'create', scope: 'role', name: 'Create Role', description: 'Create new roles' },
      { moduleId: rbacModule.id, action: 'read', scope: 'role', name: 'Read Role', description: 'View role details' },
      { moduleId: rbacModule.id, action: 'update', scope: 'role', name: 'Update Role', description: 'Update role information' },
      { moduleId: rbacModule.id, action: 'delete', scope: 'role', name: 'Delete Role', description: 'Delete roles' },
      { moduleId: rbacModule.id, action: 'list', scope: 'roles', name: 'List Roles', description: 'View list of roles' },
      { moduleId: rbacModule.id, action: 'assign', scope: 'role', name: 'Assign Role', description: 'Assign roles to users' },

      { moduleId: rbacModule.id, action: 'create', scope: 'permission', name: 'Create Permission', description: 'Create new permissions' },
      { moduleId: rbacModule.id, action: 'read', scope: 'permission', name: 'Read Permission', description: 'View permission details' },
      { moduleId: rbacModule.id, action: 'update', scope: 'permission', name: 'Update Permission', description: 'Update permission information' },
      { moduleId: rbacModule.id, action: 'delete', scope: 'permission', name: 'Delete Permission', description: 'Delete permissions' },
      { moduleId: rbacModule.id, action: 'list', scope: 'permissions', name: 'List Permissions', description: 'View list of permissions' },

      { moduleId: rbacModule.id, action: 'create', scope: 'module', name: 'Create Module', description: 'Create new modules' },
      { moduleId: rbacModule.id, action: 'read', scope: 'module', name: 'Read Module', description: 'View module details' },
      { moduleId: rbacModule.id, action: 'update', scope: 'module', name: 'Update Module', description: 'Update module information' },
      { moduleId: rbacModule.id, action: 'delete', scope: 'module', name: 'Delete Module', description: 'Delete modules' },
      { moduleId: rbacModule.id, action: 'list', scope: 'modules', name: 'List Modules', description: 'View list of modules' },

      // System permissions
      { moduleId: systemModule.id, action: 'admin', scope: '*', name: 'System Admin', description: 'Full system administration access' },
      { moduleId: systemModule.id, action: 'config', scope: 'system', name: 'System Config', description: 'Manage system configuration' },
      { moduleId: systemModule.id, action: 'health', scope: 'system', name: 'System Health', description: 'View system health status' },
    ];

    const createdPermissions = [];
    for (const permission of permissions) {
      const createdPermission = await prisma.permission.upsert({
        where: {
          moduleId_action_scope: {
            moduleId: permission.moduleId,
            action: permission.action,
            scope: permission.scope || null,
          },
        },
        update: {},
        create: permission,
      });
      createdPermissions.push(createdPermission);
    }

    console.log('✅ Permissions created successfully');

    // Create roles
    console.log('👥 Creating roles...');
    const superAdminRole = await prisma.role.upsert({
      where: { name: 'Super Admin' },
      update: {},
      create: {
        name: 'Super Admin',
        description: 'Full system access with all permissions',
        isSystem: true,
      },
    });

    const adminRole = await prisma.role.upsert({
      where: { name: 'Admin' },
      update: {},
      create: {
        name: 'Admin',
        description: 'Administrative access with most permissions',
        isSystem: true,
      },
    });

    const userRole = await prisma.role.upsert({
      where: { name: 'User' },
      update: {},
      create: {
        name: 'User',
        description: 'Standard user with basic permissions',
        isSystem: true,
      },
    });

    const guestRole = await prisma.role.upsert({
      where: { name: 'Guest' },
      update: {},
      create: {
        name: 'Guest',
        description: 'Limited access for guest users',
        isSystem: true,
      },
    });

    console.log('✅ Roles created successfully');

    // Assign permissions to roles
    console.log('🔗 Assigning permissions to roles...');

    // Super Admin gets all permissions
    for (const permission of createdPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: superAdminRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: superAdminRole.id,
          permissionId: permission.id,
        },
      });
    }

    // Admin gets most permissions (excluding super admin permissions)
    const adminPermissions = createdPermissions.filter(p => 
      !(p.action === 'admin' && p.scope === '*')
    );
    for (const permission of adminPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: adminRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      });
    }

    // User gets basic permissions
    const userPermissions = createdPermissions.filter(p => 
      (p.action === 'login' && p.scope === 'auth') || 
      (p.action === 'logout' && p.scope === 'auth') || 
      (p.action === 'refresh' && p.scope === 'auth') ||
      (p.action === 'read' && p.scope === 'user') ||
      (p.action === 'update' && p.scope === 'user')
    );
    for (const permission of userPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: userRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: userRole.id,
          permissionId: permission.id,
        },
      });
    }

    // Guest gets minimal permissions
    const guestPermissions = createdPermissions.filter(p => 
      (p.action === 'login' && p.scope === 'auth') || 
      (p.action === 'register' && p.scope === 'auth')
    );
    for (const permission of guestPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: guestRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: guestRole.id,
          permissionId: permission.id,
        },
      });
    }

    console.log('✅ Permissions assigned to roles successfully');

    // Create super admin user
    console.log('👤 Creating super admin user...');
    const hashedPassword = await bcrypt.hash('SuperAdmin123!', 12);

    const superAdminUser = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        passwordHash: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        isActive: true,
        mustChangePassword: false,
      },
    });

    // Assign super admin role to super admin user
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: superAdminUser.id,
          roleId: superAdminRole.id,
        },
      },
      update: {},
      create: {
        userId: superAdminUser.id,
        roleId: superAdminRole.id,
      },
    });

    console.log('✅ Super admin user created successfully');

    // Create demo users
    console.log('👥 Creating demo users...');
    const demoUsers = [
      {
        email: 'user@example.com',
        password: 'User123!',
        firstName: 'Demo',
        lastName: 'User',
        role: userRole,
      },
      {
        email: 'admin.demo@example.com',
        password: 'Admin123!',
        firstName: 'Demo',
        lastName: 'Admin',
        role: adminRole,
      },
    ];

    for (const demoUser of demoUsers) {
      const hashedDemoPassword = await bcrypt.hash(demoUser.password, 12);
      
      const createdUser = await prisma.user.upsert({
        where: { email: demoUser.email },
        update: {},
        create: {
          email: demoUser.email,
          passwordHash: hashedDemoPassword,
          firstName: demoUser.firstName,
          lastName: demoUser.lastName,
          isActive: true,
          mustChangePassword: false,
        },
      });

      // Assign role to user
      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: createdUser.id,
            roleId: demoUser.role.id,
          },
        },
        update: {},
        create: {
          userId: createdUser.id,
          roleId: demoUser.role.id,
        },
      });
    }

    console.log('✅ Demo users created successfully');

    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('📋 Created accounts:');
    console.log('   Super Admin: admin@example.com / SuperAdmin123!');
    console.log('   Demo Admin:  admin.demo@example.com / Admin123!');
    console.log('   Demo User:   user@example.com / User123!');
    console.log('');
    console.log('🔐 Created roles:');
    console.log('   - Super Admin (system role with all permissions)');
    console.log('   - Admin (system role with most permissions)');
    console.log('   - User (system role with basic permissions)');
    console.log('   - Guest (system role with minimal permissions)');
    console.log('');
    console.log('📦 Created modules:');
    console.log('   - auth (Authentication and authorization)');
    console.log('   - users (User management)');
    console.log('   - rbac (Role-based access control)');
    console.log('   - system (System administration)');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
