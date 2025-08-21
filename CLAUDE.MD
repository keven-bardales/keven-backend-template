# CLAUDE.md

This file provides comprehensive guidance to Claude Code when working with this Node.js/TypeScript starter template project.

## Core Development Philosophy

### KISS (Keep It Simple, Stupid)

Simplicity should be a key goal in design. Choose straightforward solutions over complex ones whenever possible. Simple solutions are easier to understand, maintain, and debug. This starter template follows clean architecture principles while keeping implementation practical and maintainable.

### YAGNI (You Aren't Gonna Need It)

Avoid building functionality on speculation. This starter template provides essential authentication and authorization features that every application needs, without over-engineering for hypothetical future requirements.

### Clean Architecture Principles

- **Dependency Inversion**: High-level modules (use cases) should not depend on low-level modules (repositories). Both depend on abstractions (interfaces).
- **Open/Closed Principle**: Software entities should be open for extension but closed for modification.
- **Single Responsibility**: Each class, function, and module should have one clear purpose.
- **Separation of Concerns**: Business logic, data access, and presentation are clearly separated.

## 🏗️ Project Architecture Overview

This is a comprehensive full-stack starter template with:

- **Backend**: Node.js/TypeScript with Express.js and clean architecture
- **Frontend**: Angular with modular structure and Angular Signals
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens with refresh token rotation
- **Authorization**: Permission-based access control with scopes (OWN/ALL/DEPARTMENT)
- **Repository Structure**: Separate repositories for backend and frontend

### Core Modules System

The template includes 5 essential modules:

1. **USERS** - User management functionality
2. **ROLES** - Role management and permission assignment
3. **MODULES** - Module management (user-manageable)
4. **PERMISSIONS** - Permission management (user-manageable)
5. **AUTH** - Authentication logs and session management

## 🧱 Code Structure & Modularity

### File and Function Limits

- **Never create a file longer than 300 lines of code**. If approaching this limit, refactor by splitting into modules.
- **Functions should be under 40 lines** with a single, clear responsibility.
- **Classes should be under 150 lines** and represent a single concept or entity.
- **Line length should be max 100 characters** (configured in ESLint/Prettier)
- **Use npm** as the package manager throughout the project.

### Backend Project Architecture

Follow strict clean architecture with dependency injection:

```
backend/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── application/
│   │   │   │   ├── dto/
│   │   │   │   ├── services/
│   │   │   │   └── use-cases/
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   ├── repositories/
│   │   │   │   └── interfaces/
│   │   │   ├── infrastructure/
│   │   │   │   ├── controllers/
│   │   │   │   ├── repositories/
│   │   │   │   └── routes/
│   │   │   └── index.ts
│   │   ├── users/
│   │   ├── roles/
│   │   ├── modules/
│   │   └── permissions/
│   ├── shared/
│   │   ├── application/
│   │   │   ├── dependencies/
│   │   │   ├── middleware/
│   │   │   └── validators/
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   ├── errors/
│   │   │   └── wrappers/
│   │   └── infrastructure/
│   │       ├── config/
│   │       ├── database/
│   │       └── utils/
│   ├── app.ts
│   └── server.ts
├── prisma/
├── tests/
└── docker/
```

### Frontend Project Architecture

Angular modular structure based on angular-keven-template:

```
frontend/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── auth/
│   │   │   ├── guards/
│   │   │   ├── interceptors/
│   │   │   └── services/
│   │   ├── shared/
│   │   │   ├── components/
│   │   │   ├── pipes/
│   │   │   ├── directives/
│   │   │   └── utils/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── roles/
│   │   │   ├── modules/
│   │   │   └── permissions/
│   │   └── layout/
│   ├── assets/
│   │   └── i18n/
│   │       ├── es.json
│   │       └── en.json
│   └── environments/
├── cypress/
└── nginx/
```

## 🛠️ Development Environment

### Package Management

This project uses **npm** for package management. Always use npm commands:

```bash
# Install dependencies
npm install

# Add a package
npm install express

# Add development dependency
npm install --save-dev @types/express

# Remove a package
npm uninstall express

# Run scripts
npm run dev
npm run build
npm test
```

### Development Commands

#### Backend Commands

```bash
# Start development server with hot reload
npm run dev

# Build TypeScript
npm run build

# Start production server
npm start

# Run database migrations
npm run db:migrate

# Seed database
npm run db:seed

# Generate Prisma client
npm run db:generate

# Open Prisma Studio
npm run db:studio

# Run tests
npm test
npm run test:watch
npm run test:coverage

# Linting and formatting
npm run lint
npm run lint:fix
npm run format
```

#### Frontend Commands

```bash
# Start development server
npm start
# or
ng serve

# Build for production
npm run build
# or
ng build

# Run tests
npm test
# or
ng test

# Run E2E tests
npm run e2e
# or
ng e2e

# Generate component/service/module
ng generate component users/user-list
ng generate service auth/auth
ng generate module users --routing
```

### Docker Development Setup

```bash
# Start all development services
docker-compose -f docker-compose.dev.yml up

# Start only database
docker-compose up postgres

# Build development images
docker-compose build

# View logs
docker-compose logs backend
docker-compose logs frontend
```

## 📋 Style & Conventions

### TypeScript Strict Typing Guidelines

- **Follow PEP8** with these specific choices:
  - Line length: 100 characters (configured in ESLint)
  - Use single quotes for strings
  - Use trailing commas in multi-line structures
  - Prefer `const` over `let`, avoid `var`
- **MANDATORY: Always use strict TypeScript typing**
  - **NEVER use `any`** - use `unknown` if type is truly unknown
  - **Use generics** wherever possible for type safety
  - **Prefer type unions** over `any` for multiple possible types
  - **Use type assertions sparingly** and only when absolutely necessary
- **All dates must be in UTC timezone**
- **Format with Prettier** (automatic on save)
- **Use ESLint** for code quality enforcement

#### Strict Typing Examples

```typescript
// ✅ Good: Use generics instead of any
interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  errors: ErrorItem[];
  timestamp: string;
}

// ✅ Good: Use unknown for truly unknown data
function processExternalData(data: unknown): ProcessedData {
  if (typeof data === 'object' && data !== null) {
    // Type narrowing before use
    return validateAndProcess(data);
  }
  throw new ValidationError('Invalid data format');
}

// ✅ Good: Use union types instead of any
type UserRole = 'admin' | 'user' | 'moderator';
type DatabaseId = string; // UUID
type Timestamp = string; // ISO string in UTC

// ❌ Bad: Never use any
function badFunction(data: any): any {
  return data.someProperty; // Avoid this!
}

// ✅ Good: Use generics for repository pattern
interface IRepository<TEntity, TId = string> {
  create(data: Omit<TEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<TEntity>;
  findById(id: TId): Promise<TEntity | null>;
  findMany<TFilter = Record<string, unknown>>(filter?: TFilter): Promise<TEntity[]>;
  update(id: TId, data: Partial<Omit<TEntity, 'id' | 'createdAt'>>): Promise<TEntity>;
  delete(id: TId): Promise<void>;
}
```

#### Date and Time Handling Standards

```typescript
// ✅ All dates stored and transmitted as UTC ISO strings
interface DateTimeFields {
  createdAt: string; // ISO 8601 UTC format: "2024-01-15T10:30:00.000Z"
  updatedAt: string; // ISO 8601 UTC format
}

// ✅ Use utility functions for date handling
export class DateUtils {
  /**
   * Get current UTC timestamp as ISO string
   */
  static utcNow(): string {
    return new Date().toISOString();
  }

  /**
   * Convert date to UTC start of day for date-only filtering
   */
  static dateOnlyUtc(date: Date | string): string {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    return d.toISOString();
  }

  /**
   * Get UTC end of day for date range filtering
   */
  static endOfDayUtc(date: Date | string): string {
    const d = new Date(date);
    d.setUTCHours(23, 59, 59, 999);
    return d.toISOString();
  }

  /**
   * Parse and validate ISO date string
   */
  static parseIsoDate(dateString: string): Date {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new ValidationError('Invalid date format, expected ISO 8601');
    }
    return date;
  }
}

// ✅ Use case examples for date filtering
interface DateFilterOptions {
  // For date-only filtering (ignoring time)
  dateOnly?: string; // "2024-01-15" - will be converted to UTC date range

  // For precise timestamp filtering
  createdAfter?: string; // ISO UTC timestamp
  createdBefore?: string; // ISO UTC timestamp

  // For date range filtering
  dateRange?: {
    start: string; // "2024-01-15" - converted to start of day UTC
    end: string; // "2024-01-20" - converted to end of day UTC
  };
}
```

### Naming Conventions

#### Backend Naming

- **Files**: `kebab-case` (e.g., `user-service.ts`, `auth-controller.ts`)
- **Classes**: `PascalCase` (e.g., `UserService`, `AuthController`)
- **Interfaces**: `PascalCase` with `I` prefix (e.g., `IUserRepository`, `IAuthService`)
- **Variables/Functions**: `camelCase` (e.g., `createUser`, `validateToken`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `JWT_SECRET`, `TOKEN_EXPIRY`)
- **Enums**: `PascalCase` with values in `UPPER_SNAKE_CASE`

#### Frontend Naming

- **Components**: `kebab-case` (e.g., `user-list.component.ts`)
- **Services**: `kebab-case` (e.g., `auth.service.ts`)
- **Classes**: `PascalCase` (e.g., `UserListComponent`, `AuthService`)
- **Properties/Methods**: `camelCase` (e.g., `isAuthenticated`, `loginUser`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `API_BASE_URL`)

### Database Naming Standards

#### Entity-Specific Primary Keys

All database tables use UUID primary keys with entity-specific naming:

```sql
-- ✅ STANDARDIZED: Entity-specific primary keys
users.id UUID PRIMARY KEY
roles.id UUID PRIMARY KEY
modules.id UUID PRIMARY KEY
permissions.id UUID PRIMARY KEY
user_roles.user_id, user_roles.role_id (composite key)
```

#### Field Naming Conventions

```sql
-- Primary keys: id (UUID)
id UUID PRIMARY KEY

-- Foreign keys: {entity}_id
user_id UUID REFERENCES users(id)
role_id UUID REFERENCES roles(id)

-- Timestamps: {action}_at
created_at, updated_at, expires_at

-- Booleans: is_{state} or must_{action}
is_active, is_system, must_change_password

-- Text fields: snake_case
first_name, last_name, password_hash
```

### API Route Standards

```typescript
// ✅ STANDARDIZED: RESTful with hybrid RPC approach
// Base path: /api/v1

// REST endpoints
GET    /api/v1/users              // List users
GET    /api/v1/users/:id          // Get user
POST   /api/v1/users              // Create user
PUT    /api/v1/users/:id          // Update user
DELETE /api/v1/users/:id          // Delete user

// RPC endpoints for complex actions
POST   /api/v1/auth/login         // Login action
POST   /api/v1/auth/refresh       // Refresh token
POST   /api/v1/auth/logout        // Logout action
POST   /api/v1/roles/assign-permissions  // Complex operation
```

## 🔧 Configuration Management

### Environment Variables

#### Backend Environment (.env)

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/starter_db"

# JWT Configuration
JWT_ACCESS_SECRET="your-super-secure-access-secret"
JWT_REFRESH_SECRET="your-super-secure-refresh-secret"
JWT_ACCESS_EXPIRES_IN="10m"
JWT_REFRESH_EXPIRES_IN="7d"

# Bcrypt
BCRYPT_SALT_ROUNDS=10

# Super Admin
SUPER_ADMIN_EMAIL="superadmin@system.com"

# Application
PORT=3000
NODE_ENV="development"

# Swagger
SWAGGER_ENABLED=true
```

#### Frontend Environment

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:3000/api/v1',
  defaultLanguage: 'es',
  supportedLanguages: ['es', 'en'],
};
```

### Configuration Classes with Strict Typing

```typescript
// ✅ Strongly typed configuration with proper validation
interface DatabaseConfig {
  readonly url: string;
}

interface JwtConfig {
  readonly accessSecret: string;
  readonly refreshSecret: string;
  readonly accessExpiresIn: string;
  readonly refreshExpiresIn: string;
}

interface AppConfig {
  readonly port: number;
  readonly nodeEnv: 'development' | 'production' | 'test';
  readonly superAdminEmail: string;
  readonly bcryptSaltRounds: number;
}

export class ConfigService {
  private static _database: DatabaseConfig | null = null;
  private static _jwt: JwtConfig | null = null;
  private static _app: AppConfig | null = null;

  static validate(): void {
    const required: Record<string, string> = {
      DATABASE_URL: 'Database connection string is required',
      JWT_ACCESS_SECRET: 'JWT access secret is required',
      JWT_REFRESH_SECRET: 'JWT refresh secret is required',
      SUPER_ADMIN_EMAIL: 'Super admin email is required',
    };

    const missing: string[] = [];

    for (const [key, message] of Object.entries(required)) {
      if (!process.env[key]) {
        missing.push(`${key}: ${message}`);
      }
    }

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables:\n${missing.join('\n')}`);
    }

    // Validate JWT secret strength
    if (process.env.JWT_ACCESS_SECRET!.length < 32) {
      throw new Error('JWT_ACCESS_SECRET must be at least 32 characters for security');
    }
  }

  static get database(): DatabaseConfig {
    if (!this._database) {
      this._database = {
        url: process.env.DATABASE_URL!,
      };
    }
    return this._database;
  }

  static get jwt(): JwtConfig {
    if (!this._jwt) {
      this._jwt = {
        accessSecret: process.env.JWT_ACCESS_SECRET!,
        refreshSecret: process.env.JWT_REFRESH_SECRET!,
        accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '10m',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      };
    }
    return this._jwt;
  }

  static get app(): AppConfig {
    if (!this._app) {
      const nodeEnv = process.env.NODE_ENV;
      if (nodeEnv !== 'development' && nodeEnv !== 'production' && nodeEnv !== 'test') {
        throw new Error('NODE_ENV must be one of: development, production, test');
      }

      this._app = {
        port: parseInt(process.env.PORT || '3000', 10),
        nodeEnv,
        superAdminEmail: process.env.SUPER_ADMIN_EMAIL!,
        bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
      };
    }
    return this._app;
  }
}
```

## 🧪 Testing Strategy

### Testing Implementation Plan

Since tests will be implemented later for development velocity, follow these guidelines when the time comes:

1. **Focus on Critical Paths First** - Prioritize testing for:
   - Authentication and authorization logic
   - User management operations
   - Permission checking mechanisms
   - Database operations
   - API error handling

2. **Testing Framework Setup**
   - **Backend**: Jest for unit and integration tests
   - **Frontend**: Jest for unit tests
   - **E2E**: Cypress for end-to-end workflows

### Backend Testing Pattern Examples (For Future Implementation)

```typescript
// Example: Use case unit test with strict typing
describe('CreateUserUseCase', () => {
  let createUserUseCase: CreateUserUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockHashService: jest.Mocked<IHashService>;

  beforeEach(() => {
    mockUserRepository = createMockUserRepository();
    mockHashService = createMockHashService();
    createUserUseCase = new CreateUserUseCase(mockUserRepository, mockHashService);
  });

  describe('execute', () => {
    it('should create user with hashed password and UTC timestamps', async () => {
      // Arrange
      const userData: CreateUserRequest = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };
      const hashedPassword = 'hashed_password';
      const mockUser: User = createMockUserWithUtcDates();

      mockHashService.hash.mockResolvedValue(hashedPassword);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser);

      // Act
      const result = await createUserUseCase.execute(userData);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockHashService.hash).toHaveBeenCalledWith('password123');
      expect(mockUser.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });
});
```

### Frontend Testing Pattern Examples (For Future Implementation)

```typescript
// Example: Component test with Angular Signals
describe('UserListComponent', () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;
  let mockUserService: jest.Mocked<UserService>;

  beforeEach(async () => {
    const userServiceSpy = createSpyObj('UserService', ['getUsers', 'deleteUser']);

    await TestBed.configureTestingModule({
      imports: [UserListComponent],
      providers: [{ provide: UserService, useValue: userServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
    mockUserService = TestBed.inject(UserService) as jest.Mocked<UserService>;
  });

  it('should display users with UTC formatted dates', async () => {
    // Arrange
    const mockUsers: User[] = [createMockUserWithUtcDates(), createMockUserWithUtcDates()];
    mockUserService.getUsers.mockReturnValue(signal(mockUsers));

    // Act
    fixture.detectChanges();

    // Assert
    const userElements = fixture.debugElement.queryAll(By.css('.user-item'));
    expect(userElements.length).toBe(2);
  });
});
```

## 🚨 Error Handling

### Result Pattern Implementation

```typescript
// Shared Result pattern for consistent error handling
export class Result<T> {
  public readonly isSuccess: boolean;
  public readonly data: T | null;
  public readonly errors: ErrorItem[];

  private constructor(isSuccess: boolean, data: T | null, errors: ErrorItem[]) {
    this.isSuccess = isSuccess;
    this.data = data;
    this.errors = errors;
  }

  public get criticalErrors(): ErrorItem[] {
    return this.errors.filter(error => error.critical);
  }

  public get nonCriticalErrors(): ErrorItem[] {
    return this.errors.filter(error => !error.critical);
  }

  public static success<T>(data: T): Result<T> {
    return new Result<T>(true, data, []);
  }

  public static failure<T>(errors: ErrorItem[]): Result<T> {
    return new Result<T>(false, null, errors);
  }
}

export interface ErrorItem {
  type: string;
  code: string;
  message: string;
  field?: string;
  critical: boolean;
}
```

### Custom Domain Errors

```typescript
// Base domain error
export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly critical: boolean;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

// Specific error types
export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';
  readonly critical = true;

  constructor(
    message: string,
    public readonly field?: string
  ) {
    super(message);
  }
}

export class UnauthorizedError extends DomainError {
  readonly code = 'UNAUTHORIZED';
  readonly critical = true;

  constructor(message: string = 'Unauthorized access') {
    super(message);
  }
}

export class ForbiddenError extends DomainError {
  readonly code = 'FORBIDDEN';
  readonly critical = true;

  constructor(message: string = 'Insufficient permissions') {
    super(message);
  }
}
```

### Global Error Handler (Express)

```typescript
export const globalErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let errorResponse: ApiResponse<null>;

  if (error instanceof ValidationError) {
    statusCode = 400;
    errorResponse = {
      success: false,
      data: null,
      errors: [
        {
          type: 'ValidationError',
          code: error.code,
          message: error.message,
          field: error.field,
          critical: true,
        },
      ],
      timestamp: new Date().toISOString(),
    };
  } else if (error instanceof UnauthorizedError) {
    statusCode = 401;
    errorResponse = {
      success: false,
      data: null,
      errors: [
        {
          type: 'UnauthorizedError',
          code: error.code,
          message: error.message,
          critical: true,
        },
      ],
      timestamp: new Date().toISOString(),
    };
  } else {
    // Generic error handling
    errorResponse = {
      success: false,
      data: null,
      errors: [
        {
          type: 'InternalServerError',
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          critical: true,
        },
      ],
      timestamp: new Date().toISOString(),
    };
  }

  res.status(statusCode).json(errorResponse);
};
```

## 🔐 Security Best Practices

### Authentication Security

```typescript
// JWT token service with rotation
export class TokenService {
  generateTokens(userId: string, permissions: string[]) {
    const accessToken = jwt.sign({ userId, permissions }, ConfigService.jwt.accessSecret, {
      expiresIn: ConfigService.jwt.accessExpiresIn,
    });

    const refreshToken = jwt.sign({ userId, type: 'refresh' }, ConfigService.jwt.refreshSecret, {
      expiresIn: ConfigService.jwt.refreshExpiresIn,
    });

    return { accessToken, refreshToken };
  }

  verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, ConfigService.jwt.accessSecret) as TokenPayload;
    } catch (error) {
      throw new UnauthorizedError('Invalid access token');
    }
  }
}
```

### Permission Validation

```typescript
// Permission checking middleware
export const requirePermission = (permission: string, scope: 'OWN' | 'ALL' = 'ALL') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user; // Set by auth middleware

    if (!user) {
      throw new UnauthorizedError();
    }

    const hasPermission = user.permissions.some(
      p => p === `${permission}_${scope}` || p === `${permission}_ALL`
    );

    if (!hasPermission) {
      throw new ForbiddenError(`Missing permission: ${permission}_${scope}`);
    }

    next();
  };
};

// Usage in routes
router.get('/users', authenticateToken, requirePermission('USERS_READ', 'ALL'), getUsersController);

router.get(
  '/users/profile',
  authenticateToken,
  requirePermission('USERS_READ', 'OWN'),
  getCurrentUserController
);
```

### Input Validation with Zod

```typescript
// Validation schemas
export const CreateUserSchema = z.object({
  email: z.string().email().min(1).max(255),
  password: z.string().min(8).max(100),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Validation middleware
export const validateRequest = <T>(schema: z.ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          type: 'ValidationError',
          code: 'INVALID_INPUT',
          message: err.message,
          field: err.path.join('.'),
          critical: true,
        }));

        res.status(400).json({
          success: false,
          data: null,
          errors,
          timestamp: new Date().toISOString(),
        });
      } else {
        next(error);
      }
    }
  };
};
```

## 🗄️ Database & ORM Patterns

### Prisma Schema Standards

```prisma
// Follow consistent naming patterns
model User {
  id                   String      @id @default(uuid()) @db.Uuid
  email                String      @unique @db.VarChar(255)
  passwordHash         String      @map("password_hash") @db.VarChar(255)
  mustChangePassword   Boolean     @default(true) @map("must_change_password")
  firstName            String?     @map("first_name") @db.VarChar(100)
  lastName             String?     @map("last_name") @db.VarChar(100)
  isActive             Boolean     @default(true) @map("is_active")
  createdAt            DateTime    @default(now()) @map("created_at")
  updatedAt            DateTime    @updatedAt @map("updated_at")

  // Relations
  userRoles            UserRole[]

  @@map("users")
}
```

### Repository Pattern with Strict Typing

```typescript
// ✅ Generic repository interface with strict typing
interface IRepository<
  TEntity extends { id: string },
  TCreateData = Omit<TEntity, 'id' | 'createdAt' | 'updatedAt'>,
  TUpdateData = Partial<Omit<TEntity, 'id' | 'createdAt'>>,
> {
  create(data: TCreateData): Promise<TEntity>;
  findById(id: string): Promise<TEntity | null>;
  findMany<TFilter extends Record<string, unknown> = Record<string, unknown>>(options?: {
    filter?: TFilter;
    pagination?: {
      page: number;
      limit: number;
    };
    orderBy?: {
      field: keyof TEntity;
      direction: 'asc' | 'desc';
    };
  }): Promise<{
    data: TEntity[];
    total: number;
  }>;
  update(id: string, data: TUpdateData): Promise<TEntity>;
  delete(id: string): Promise<void>;
}

// ✅ User-specific repository interface
interface IUserRepository extends IRepository<User, CreateUserData, UpdateUserData> {
  findByEmail(email: string): Promise<UserWithRoles | null>;
  findUsersWithRoles(options?: {
    isActive?: boolean;
    roleIds?: string[];
  }): Promise<UserWithRoles[]>;
}

// ✅ Strongly typed DTOs
interface CreateUserData {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  mustChangePassword: boolean;
}

interface UpdateUserData {
  email?: string;
  passwordHash?: string;
  firstName?: string;
  lastName?: string;
  mustChangePassword?: boolean;
  isActive?: boolean;
}

interface UserWithRoles extends User {
  userRoles: Array<{
    roleId: string;
    assignedAt: string;
    role: {
      id: string;
      name: string;
      rolePermissions: Array<{
        permissionId: string;
        permission: {
          id: string;
          name: string;
          action: string;
          scope: 'OWN' | 'ALL' | 'DEPARTMENT';
        };
      }>;
    };
  }>;
}

// ✅ Repository implementation with UTC date handling
export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(userData: CreateUserData): Promise<User> {
    const now = DateUtils.utcNow();

    return this.prisma.user.create({
      data: {
        ...userData,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
        isActive: true,
      },
    });
  }

  async findByEmail(email: string): Promise<UserWithRoles | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async findMany<TFilter extends Record<string, unknown>>(options?: {
    filter?: TFilter;
    pagination?: { page: number; limit: number };
    orderBy?: { field: keyof User; direction: 'asc' | 'desc' };
  }): Promise<{ data: User[]; total: number }> {
    const where = this.buildWhereClause(options?.filter);
    const orderBy = options?.orderBy
      ? {
          [options.orderBy.field]: options.orderBy.direction,
        }
      : { createdAt: 'desc' as const };

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy,
        skip: options?.pagination
          ? (options.pagination.page - 1) * options.pagination.limit
          : undefined,
        take: options?.pagination?.limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, total };
  }

  private buildWhereClause(filter: Record<string, unknown> | undefined): Record<string, unknown> {
    if (!filter) return {};

    const where: Record<string, unknown> = {};

    // Handle date filtering with UTC
    if (filter.createdAfter && typeof filter.createdAfter === 'string') {
      where.createdAt = { ...(where.createdAt as object), gte: filter.createdAfter };
    }
    if (filter.createdBefore && typeof filter.createdBefore === 'string') {
      where.createdAt = { ...(where.createdAt as object), lte: filter.createdBefore };
    }
    if (filter.dateOnly && typeof filter.dateOnly === 'string') {
      const startOfDay = DateUtils.dateOnlyUtc(filter.dateOnly);
      const endOfDay = DateUtils.endOfDayUtc(filter.dateOnly);
      where.createdAt = { gte: startOfDay, lte: endOfDay };
    }

    // Handle other filters
    if (typeof filter.isActive === 'boolean') {
      where.isActive = filter.isActive;
    }
    if (typeof filter.email === 'string') {
      where.email = { contains: filter.email, mode: 'insensitive' };
    }

    return where;
  }
}
```

## 🚀 Performance Considerations

### Backend Optimization with Strict Typing

```typescript
// ✅ Strongly typed connection configuration
interface DatabaseConnectionConfig {
  readonly url: string;
  readonly maxConnections: number;
  readonly connectionTimeoutMs: number;
  readonly queryTimeoutMs: number;
}

// ✅ Use connection pooling with proper typing
const createPrismaClient = (config: DatabaseConnectionConfig): PrismaClient => {
  return new PrismaClient({
    datasources: {
      db: {
        url: config.url,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  });
};

// ✅ Implement strongly typed caching for permissions
interface CacheEntry<T> {
  data: T;
  expiresAt: number; // UTC timestamp
}

class PermissionCacheService {
  private readonly cache = new Map<string, CacheEntry<string[]>>();
  private readonly TTL_MS = 5 * 60 * 1000; // 5 minutes

  async getUserPermissions(userId: string): Promise<string[]> {
    const cached = this.cache.get(userId);
    const now = Date.now();

    if (cached && cached.expiresAt > now) {
      return cached.data;
    }

    const permissions = await this.fetchUserPermissions(userId);

    this.cache.set(userId, {
      data: permissions,
      expiresAt: now + this.TTL_MS,
    });

    return permissions;
  }

  private async fetchUserPermissions(userId: string): Promise<string[]> {
    // Implementation with proper error handling
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return [];
      }

      return this.extractPermissions(user);
    } catch (error) {
      this.logger.error('Failed to fetch user permissions', { userId, error });
      return [];
    }
  }

  private extractPermissions(user: UserWithRoles): string[] {
    return user.userRoles.flatMap(userRole =>
      userRole.role.rolePermissions.map(rp => rp.permission.name)
    );
  }

  clearUserCache(userId: string): void {
    this.cache.delete(userId);
  }

  clearExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt <= now) {
        this.cache.delete(key);
      }
    }
  }
}
```

### Frontend Optimization with Strict Typing

```typescript
// ✅ Use OnPush change detection with strict typing
@Component({
  selector: 'app-user-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div *ngFor="let user of users(); trackBy: trackByUserId">
      <span>{{ user.email }}</span>
      <span>{{ formatUtcDate(user.createdAt) }}</span>
    </div>
  `,
})
export class UserListComponent {
  readonly users = input.required<readonly User[]>();

  trackByUserId(index: number, user: User): string {
    return user.id;
  }

  formatUtcDate(utcDateString: string): string {
    // Format UTC date for display in user's local timezone
    return new Date(utcDateString).toLocaleDateString();
  }
}

// ✅ Use signals with proper typing for reactive state management
interface UserServiceState {
  readonly users: readonly User[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly selectedUser: User | null;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly httpClient = inject(HttpClient);

  // Private state signals
  private readonly _users = signal<readonly User[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _selectedUser = signal<User | null>(null);

  // Public readonly signals
  readonly users = this._users.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly selectedUser = this._selectedUser.asReadonly();

  // Computed signals with strict typing
  readonly activeUsers = computed(() => this._users().filter(user => user.isActive));

  readonly userCount = computed(() => this._users().length);

  readonly hasUsers = computed(() => this._users().length > 0);

  async loadUsers(filter?: UserFilterOptions): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const response = await firstValueFrom(
        this.httpClient.get<ApiResponse<User[]>>('/api/v1/users', {
          params: this.buildFilterParams(filter),
        })
      );

      if (response.success) {
        this._users.set(response.data || []);
      } else {
        this._error.set('Failed to load users');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this._error.set(errorMessage);
    } finally {
      this._loading.set(false);
    }
  }

  private buildFilterParams(filter?: UserFilterOptions): Record<string, string> {
    if (!filter) return {};

    const params: Record<string, string> = {};

    if (filter.isActive !== undefined) {
      params['isActive'] = filter.isActive.toString();
    }
    if (filter.email) {
      params['email'] = filter.email;
    }
    if (filter.dateRange) {
      params['createdAfter'] = DateUtils.dateOnlyUtc(filter.dateRange.start);
      params['createdBefore'] = DateUtils.endOfDayUtc(filter.dateRange.end);
    }

    return params;
  }

  selectUser(user: User | null): void {
    this._selectedUser.set(user);
  }
}

// ✅ Strongly typed filter options
interface UserFilterOptions {
  readonly isActive?: boolean;
  readonly email?: string;
  readonly dateRange?: {
    readonly start: string; // ISO date string
    readonly end: string; // ISO date string
  };
}
```

## 🔄 Git Workflow

### Branch Strategy

- `main` - Production-ready code (protected branch)
- `develop` - Integration branch for features
- `feature/*` - New features (e.g., `feature/user-management`)
- `fix/*` - Bug fixes (e.g., `fix/auth-token-refresh`)
- `docs/*` - Documentation updates
- `refactor/*` - Code refactoring
- `test/*` - Test additions or fixes

### Commit Message Format

Follow conventional commits format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:

```
feat(auth): implement JWT refresh token rotation

- Add refresh token rotation on each token refresh
- Store refresh tokens in database for revocation capability
- Add cleanup job for expired tokens

Closes #123

fix(users): resolve pagination issue in user list

- Fix off-by-one error in pagination calculation
- Add proper error handling for invalid page numbers
- Update tests to cover edge cases

Closes #124
```

## 📝 Documentation Standards

### Code Documentation

````typescript
/**
 * Service responsible for user authentication and authorization.
 *
 * Handles user login, token generation, permission validation, and session management.
 * Implements JWT token strategy with refresh token rotation for enhanced security.
 */
@Injectable()
export class AuthService {
  /**
   * Authenticates a user with email and password.
   *
   * @param credentials - User login credentials
   * @returns Promise resolving to authentication result with tokens and user info
   * @throws UnauthorizedError when credentials are invalid
   * @throws ValidationError when credentials format is invalid
   *
   * @example
   * ```typescript
   * const result = await authService.login({
   *   email: 'user@example.com',
   *   password: 'securePassword123'
   * });
   *
   * if (result.isSuccess) {
   *   console.log('Login successful:', result.data.user);
   * }
   * ```
   */
  async login(credentials: LoginCredentials): Promise<Result<AuthResult>> {
    // Implementation
  }
}
````

### API Documentation with Swagger

```typescript
/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Authenticate user
 *     description: Authenticates a user with email and password, returns JWT tokens
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 minimum: 8
 *                 example: securePassword123
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', validateRequest(LoginSchema), loginController);
```

## 🛡️ Security Checklist

### Production Security Requirements

- [ ] Environment variables secured and not committed to git
- [ ] JWT secrets are cryptographically strong (min 256 bits)
- [ ] Password hashing uses bcrypt with sufficient rounds (10+)
- [ ] Input validation on all endpoints using Zod schemas
- [ ] Rate limiting implemented on authentication endpoints
- [ ] HTTPS enforced in production
- [ ] Security headers configured (HSTS, CSRF protection, etc.)
- [ ] Database queries use parameterized statements (Prisma provides this)
- [ ] File upload restrictions in place
- [ ] Error messages don't leak sensitive information
- [ ] Logging excludes sensitive data (passwords, tokens)
- [ ] Regular dependency updates for security patches

## 🚀 Deployment Guidelines

### Docker Production Setup

```dockerfile
# Backend Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
RUN npx prisma generate

FROM node:18-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY package.json ./
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment-Specific Configurations

```typescript
// Production environment validation
export class ProductionConfigValidator {
  static validate(): void {
    const requiredProdVars = [
      'DATABASE_URL',
      'JWT_ACCESS_SECRET',
      'JWT_REFRESH_SECRET',
      'SUPER_ADMIN_EMAIL',
    ];

    const missingVars = requiredProdVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required production environment variables: ${missingVars.join(', ')}`
      );
    }

    // Validate JWT secret strength
    if (process.env.JWT_ACCESS_SECRET!.length < 32) {
      throw new Error('JWT_ACCESS_SECRET must be at least 32 characters');
    }
  }
}
```

## 📊 Monitoring and Observability

### Structured Logging

```typescript
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'starter-template-backend',
    version: process.env.APP_VERSION || '1.0.0',
  },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

// Usage with context
logger.info('User login attempt', {
  userId: user.id,
  email: user.email,
  ipAddress: req.ip,
  userAgent: req.get('User-Agent'),
});
```

## ⚠️ Important Notes

### Development Guidelines

- **NEVER ASSUME OR GUESS** - When in doubt about requirements, ask for clarification
- **Always verify file paths and imports** before implementing
- **Test your code** - No feature is complete without proper tests
- **Follow the established patterns** - Consistency is key for maintainability
- **Update documentation** - Keep CLAUDE.md and README files current
- **Security first** - Always consider security implications of your changes

### Code Review Checklist

- [ ] Code follows established naming conventions
- [ ] All public methods have proper documentation
- [ ] Error handling follows the Result pattern
- [ ] Input validation is implemented with Zod
- [ ] Tests cover the new functionality
- [ ] No sensitive data is logged or exposed
- [ ] Database queries are optimized
- [ ] Frontend components use proper change detection strategies

### Common Patterns to Follow with Strict Typing

```typescript
// ✅ Good: Use dependency injection with strong typing
interface IUserRepository {
  create(data: CreateUserData): Promise<User>;
  findByEmail(email: string): Promise<UserWithRoles | null>;
  // ... other methods
}

interface IHashService {
  hash(password: string): Promise<string>;
  verify(password: string, hash: string): Promise<boolean>;
}

interface ILogger {
  info(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
}

export class UserService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly hashService: IHashService,
    private readonly logger: ILogger
  ) {}
}

// ✅ Good: Use Result pattern with generic types for error handling
async createUser(userData: CreateUserRequest): Promise<Result<CreateUserResponse>> {
  try {
    // Email uniqueness validation
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      return Result.failure<CreateUserResponse>([{
        type: 'ValidationError',
        code: 'EMAIL_EXISTS',
        message: 'Email already exists',
        field: 'email',
        critical: true
      }]);
    }

    // Hash password
    const hashedPassword = await this.hashService.hash(userData.password);

    // Create user with UTC timestamps
    const createData: CreateUserData = {
      email: userData.email,
      passwordHash: hashedPassword,
      firstName: userData.firstName,
      lastName: userData.lastName,
      mustChangePassword: true
    };

    const user = await this.userRepository.create(createData);

    // Return response without sensitive data
    const response: CreateUserResponse = {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      mustChangePassword: user.mustChangePassword
    };

    return Result.success(response);
  } catch (error) {
    this.logger.error('Failed to create user', {
      error: error instanceof Error ? error.message : 'Unknown error',
      email: userData.email
    });

    return Result.failure<CreateUserResponse>([{
      type: 'InternalError',
      code: 'USER_CREATION_FAILED',
      message: 'Failed to create user',
      critical: true
    }]);
  }
}

// ✅ Good: Use Angular Signals with strict typing for reactive state
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly httpClient = inject(HttpClient);

  // Private state with strict types
  private readonly _isAuthenticated = signal<boolean>(false);
  private readonly _currentUser = signal<User | null>(null);
  private readonly _permissions = signal<readonly string[]>([]);

  // Public readonly computed signals
  readonly isAuthenticated = this._isAuthenticated.asReadonly();
  readonly currentUser = this._currentUser.asReadonly();
  readonly permissions = this._permissions.asReadonly();

  // Computed permission checks
  readonly isAdmin = computed(() =>
    this._permissions().some(p => p.startsWith('ADMIN_'))
  );

  readonly canManageUsers = computed(() =>
    this._permissions().includes('USERS_READ_ALL') ||
    this._permissions().includes('USERS_UPDATE_ALL')
  );

  async login(credentials: LoginRequest): Promise<Result<LoginResponse>> {
    try {
      const response = await firstValueFrom(
        this.httpClient.post<ApiResponse<LoginResponse>>('/api/v1/auth/login', credentials)
      );

      if (response.success && response.data) {
        this._isAuthenticated.set(true);
        this._currentUser.set(response.data.user);
        this._permissions.set(response.data.permissions);

        // Store tokens securely
        this.storeTokens(response.data.tokens);

        return Result.success(response.data);
      } else {
        return Result.failure(response.errors || [{
          type: 'AuthenticationError',
          code: 'LOGIN_FAILED',
          message: 'Login failed',
          critical: true
        }]);
      }
    } catch (error) {
      return Result.failure([{
        type: 'NetworkError',
        code: 'LOGIN_REQUEST_FAILED',
        message: 'Network error during login',
        critical: true
      }]);
    }
  }

  hasPermission(permission: string): boolean {
    return this._permissions().includes(permission);
  }

  hasAnyPermission(permissions: readonly string[]): boolean {
    const userPermissions = this._permissions();
    return permissions.some(p => userPermissions.includes(p));
  }

  private storeTokens(tokens: { accessToken: string; refreshToken: string }): void {
    // Store in secure HTTP-only cookies or secure storage
    // Implementation depends on security requirements
  }
}

// ✅ Good: Use strict typing for API responses and DTOs
interface LoginRequest {
  readonly email: string;
  readonly password: string;
}

interface LoginResponse {
  readonly user: Omit<User, 'passwordHash'>;
  readonly tokens: {
    readonly accessToken: string;
    readonly refreshToken: string;
    readonly expiresIn: number;
  };
  readonly permissions: readonly string[];
}

interface CreateUserRequest {
  readonly email: string;
  readonly password: string;
  readonly firstName: string;
  readonly lastName: string;
}

interface CreateUserResponse {
  readonly user: Omit<User, 'passwordHash' | 'userRoles'>;
  readonly mustChangePassword: boolean;
}

// ❌ Bad: Never use any or loose typing
function badFunction(data: any): any {
  return data.someProperty; // Avoid this!
}

// ❌ Bad: Avoid non-UTC dates
function badDateHandling(): void {
  const now = new Date(); // Uses local timezone - avoid!
  const dateString = now.toString(); // Non-ISO format - avoid!
}

// ✅ Good: Always use UTC dates
function goodDateHandling(): string {
  return DateUtils.utcNow(); // Returns ISO UTC string
}
```

## 📚 Additional Resources

### Essential Dependencies

#### Backend

- **Express.js**: Web framework
- **Prisma**: Database ORM
- **Jest**: Testing framework
- **Zod**: Schema validation
- **Winston**: Logging
- **bcrypt**: Password hashing
- **jsonwebtoken**: JWT handling
- **Swagger**: API documentation

#### Frontend

- **Angular**: Frontend framework
- **Angular Material**: UI components
- **RxJS**: Reactive programming
- **Jest**: Testing framework
- **Cypress**: E2E testing

### Documentation Links

- [Express.js Documentation](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Angular Documentation](https://angular.io/docs)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

_This CLAUDE.md file is a living document. Update it as the project evolves and new patterns emerge. Always keep it synchronized with the actual implementation._
