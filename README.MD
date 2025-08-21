# Starter Template Backend API

A comprehensive Node.js/TypeScript backend API built with clean architecture principles, featuring authentication, authorization, and a flexible permission-based access control system.

## 🚀 Features

- **Clean Architecture** with dependency injection
- **JWT Authentication** with refresh token rotation (10min access, 7-day refresh)
- **Permission-based Authorization** with scope control (OWN/ALL/DEPARTMENT)
- **PostgreSQL Database** with Prisma ORM
- **Strict TypeScript** with comprehensive type safety
- **Input Validation** using Zod schemas
- **API Documentation** with Swagger/OpenAPI
- **Error Handling** with Result pattern and custom domain errors
- **Multi-language Support** (Spanish primary, English, extensible)
- **Docker Support** for development and production
- **UTC Timezone** handling for all dates

## 🏗️ Architecture Overview

```
src/
├── modules/
│   ├── auth/           # Authentication & authorization
│   ├── users/          # User management
│   ├── roles/          # Role management
│   ├── modules/        # Module management
│   └── permissions/    # Permission management
├── shared/
│   ├── application/    # Shared services, middleware
│   ├── domain/         # Shared entities, errors
│   └── infrastructure/ # Database, config, utils
├── app.ts
└── server.ts
```

### Core Modules

1. **USERS** - User management functionality
2. **ROLES** - Role management and permission assignment
3. **MODULES** - Module management (user-manageable)
4. **PERMISSIONS** - Permission management (user-manageable)
5. **AUTH** - Authentication logs and session management

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens with bcrypt password hashing
- **Validation**: Zod schemas
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest (to be implemented)
- **Container**: Docker & Docker Compose

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+ (or use Docker)
- Docker & Docker Compose (optional but recommended)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd starter-backend
npm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### 3. Database Setup

#### Option A: Using Docker (Recommended)
```bash
# Start PostgreSQL container
docker-compose up -d postgres

# Run migrations and seed
npm run db:migrate
npm run db:seed
```

#### Option B: Local PostgreSQL
```bash
# Make sure PostgreSQL is running locally
# Update DATABASE_URL in .env
npm run db:migrate
npm run db:seed
```

### 4. Start Development Server

```bash
# Start with hot reload
npm run dev

# Or start all services with Docker
docker-compose -f docker-compose.dev.yml up
```

The API will be available at:
- **API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api/docs
- **Database Studio**: http://localhost:5555 (run `npm run db:studio`)

## 🔑 Default Credentials

After seeding, you can login with:
- **Email**: Value from `SUPER_ADMIN_EMAIL` environment variable
- **Password**: `TempPassword123!` (must be changed on first login)

## 📖 API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | User login |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | User logout |
| POST | `/auth/change-password` | Change user password |

### User Management Endpoints

| Method | Endpoint | Description | Permissions Required |
|--------|----------|-------------|---------------------|
| GET | `/users` | List users | `USERS_READ_ALL` |
| GET | `/users/:id` | Get user by ID | `USERS_READ_ALL` or `USERS_READ_OWN` |
| POST | `/users` | Create user | `USERS_CREATE_ALL` |
| PUT | `/users/:id` | Update user | `USERS_UPDATE_ALL` or `USERS_UPDATE_OWN` |
| DELETE | `/users/:id` | Delete user | `USERS_DELETE_ALL` |

### Role Management Endpoints

| Method | Endpoint | Description | Permissions Required |
|--------|----------|-------------|---------------------|
| GET | `/roles` | List roles | `ROLES_READ_ALL` |
| POST | `/roles` | Create role | `ROLES_CREATE_ALL` |
| PUT | `/roles/:id` | Update role | `ROLES_UPDATE_ALL` |
| DELETE | `/roles/:id` | Delete role | `ROLES_DELETE_ALL` |
| POST | `/roles/assign-permissions` | Assign permissions to role | `ROLES_UPDATE_ALL` |

### Example Request/Response

#### Login Request
```json
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Login Response
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    "tokens": {
      "accessToken": "jwt-token",
      "refreshToken": "refresh-token",
      "expiresIn": 600
    },
    "permissions": ["USERS_READ_ALL", "ROLES_READ_ALL"]
  },
  "errors": [],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Error Response
```json
{
  "success": false,
  "data": null,
  "errors": [
    {
      "type": "ValidationError",
      "code": "INVALID_EMAIL",
      "message": "Email format is invalid",
      "field": "email",
      "critical": true
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/starter_db"

# JWT Configuration
JWT_ACCESS_SECRET="your-super-secure-access-secret-key"
JWT_REFRESH_SECRET="your-super-secure-refresh-secret-key"
JWT_ACCESS_EXPIRES_IN="10m"
JWT_REFRESH_EXPIRES_IN="7d"

# Bcrypt
BCRYPT_SALT_ROUNDS=10

# Super Admin
SUPER_ADMIN_EMAIL="superadmin@yourcompany.com"

# Application
PORT=3000
NODE_ENV="development"

# Swagger Documentation
SWAGGER_ENABLED=true
```

### Required Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_ACCESS_SECRET` - Secret for access tokens (min 32 characters)
- `JWT_REFRESH_SECRET` - Secret for refresh tokens (min 32 characters)
- `SUPER_ADMIN_EMAIL` - Email for the Super Admin user

## 🗄️ Database Schema

### Core Entities

- **Users** - User accounts with authentication
- **Roles** - User roles for permission grouping
- **Modules** - Application modules (USERS, ROLES, etc.)
- **Permissions** - Granular permissions with action and scope
- **UserRoles** - Many-to-many relationship between users and roles
- **RolePermissions** - Many-to-many relationship between roles and permissions

### Permission System

Permissions follow the format: `{MODULE}_{ACTION}_{SCOPE}`

**Actions**: CREATE, READ, UPDATE, DELETE, EXPORT
**Scopes**: OWN (own records), ALL (any records), DEPARTMENT (future)

Examples:
- `USERS_READ_OWN` - Can read own user data
- `USERS_READ_ALL` - Can read any user data
- `ROLES_CREATE_ALL` - Can create roles
- `USERS_UPDATE_ALL` - Can update any user

## 🧪 Development Commands

```bash
# Development
npm run dev              # Start development server with hot reload
npm run build            # Build TypeScript to JavaScript
npm start                # Start production server

# Database
npm run db:migrate       # Run database migrations
npm run db:seed          # Seed database with initial data
npm run db:generate      # Generate Prisma client
npm run db:studio        # Open Prisma Studio
npm run db:reset         # Reset database (dev only)

# Code Quality
npm run lint             # Check ESLint rules
npm run lint:fix         # Fix ESLint issues automatically
npm run format           # Format code with Prettier
npm run type-check       # Check TypeScript types

# Testing (when implemented)
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage

# Docker
docker-compose up -d postgres    # Start only database
docker-compose up               # Start all services
docker-compose down             # Stop all services
docker-compose logs backend     # View backend logs
```

## 📊 API Response Format

All API responses follow a consistent format:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  errors: ErrorItem[];
  pagination?: PaginationInfo; // For paginated responses
  timestamp: string; // ISO UTC timestamp
}

interface ErrorItem {
  type: string;
  code: string;
  message: string;
  field?: string;
  critical: boolean;
}
```

## 🔐 Security Features

- **JWT Token Authentication** with short-lived access tokens
- **Refresh Token Rotation** for enhanced security
- **bcrypt Password Hashing** with configurable salt rounds
- **Input Validation** on all endpoints using Zod schemas
- **Permission-based Authorization** with granular access control
- **Security Headers** configured for production
- **No Sensitive Data Logging** - passwords and tokens excluded

## 🚀 Deployment

### Docker Production

```bash
# Build production image
docker build -t starter-backend .

# Run with environment variables
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_ACCESS_SECRET="..." \
  starter-backend
```

### Environment-Specific Deployment

1. **Digital Ocean Apps** - Use `.do/app.yaml` configuration
2. **Railway** - Connect GitHub repository
3. **AWS/GCP** - Use Docker containers with managed databases

### Production Checklist

- [ ] Strong JWT secrets (min 32 characters)
- [ ] Secure DATABASE_URL with SSL
- [ ] Set NODE_ENV=production
- [ ] Configure reverse proxy (Nginx)
- [ ] Set up SSL certificates
- [ ] Configure monitoring and logging
- [ ] Set up database backups
- [ ] Configure rate limiting

## 🔍 Monitoring and Logging

The application uses structured logging with Winston:

```bash
# View logs
tail -f logs/combined.log    # All logs
tail -f logs/error.log       # Error logs only
```

Log format includes:
- Timestamp (UTC)
- Log level
- Service name
- Request context
- User information (when available)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow the coding standards in `CLAUDE.md`
4. Commit changes (`git commit -m 'feat: add amazing feature'`)
5. Push to branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

### Development Guidelines

- **Never use `any`** - use `unknown` or proper types
- **All dates in UTC** - use `DateUtils` for date handling
- **Follow Result pattern** - for consistent error handling
- **Strict TypeScript** - enable all strict mode options
- **Test critical paths** - authentication, authorization, data validation

## 📚 Additional Resources

- [API Documentation (Swagger)](http://localhost:3000/api/docs)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Express.js Documentation](https://expressjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For questions and support:

1. Check the [API Documentation](http://localhost:3000/api/docs)
2. Review the [CLAUDE.md](CLAUDE.md) development guide
3. Open an issue in the repository
4. Check existing issues and discussions

---

**Built with ❤️ for rapid application development**