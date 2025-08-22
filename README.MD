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

Choose your development approach:

### For Local Development
- Node.js 18+ and npm
- PostgreSQL 15+ installed locally
- Basic command line knowledge

### For Docker Development  
- Docker & Docker Compose
- No other dependencies needed

## 🚀 Quick Start

Choose one of two development approaches:

---

## 🏠 **Option 1: Local Development** (Traditional)

Perfect for developers who prefer working with local tools and have PostgreSQL installed.

### 1. Clone Repository
```bash
git clone <repository-url>
cd keven-backend-template
```

### 2. Run Setup Script

#### Windows
```bash
setup-local.bat
```

#### Linux/macOS
```bash
chmod +x setup-local.sh
./setup-local.sh
```

The setup script will:
- ✅ Check Node.js installation (18+)
- ✅ Check PostgreSQL availability
- ✅ Copy `.env.example` to `.env`
- ✅ Install dependencies
- ✅ Run database migrations
- ✅ Smart seed database (only if empty)
- ✅ Generate Prisma client

### 3. Configure Environment
Update `.env` with your database credentials:
```bash
# Edit the generated .env file
DATABASE_URL="postgresql://keven_user:your_password@localhost:5432/keven_dev_db"
JWT_ACCESS_SECRET="your-super-secure-access-secret"
JWT_REFRESH_SECRET="your-super-secure-refresh-secret"
SUPER_ADMIN_EMAIL="admin@yourcompany.com"
```

### 4. Start Development Server
```bash
npm run dev
```

**Local Development URLs:**
- **API**: http://localhost:3000
- **API Docs**: http://localhost:3000/api/docs
- **Database Studio**: `npm run db:studio` → http://localhost:5555

---

## 🐳 **Option 2: Docker Development** (Recommended)

Perfect for rapid setup with zero configuration. Everything runs in containers with hot reload.

### 1. Clone Repository
```bash
git clone <repository-url>
cd keven-backend-template
```

### 2. Quick Start with Docker
```bash
# Copy Docker environment template
cp .env.docker.example .env.docker

# Start development environment with hot reload
npm run docker:dev
```

That's it! The Docker setup includes:
- ✅ PostgreSQL database with persistent data
- ✅ Redis cache (optional, use `--profile redis`)
- ✅ Backend API with hot reload
- ✅ Automatic database migrations
- ✅ Smart database seeding
- ✅ Volume mounts for code changes

### Docker Development Commands
```bash
# Start with hot reload (recommended)
npm run docker:dev

# Start with Redis cache
npm run docker:dev --profile redis

# Stop all services
npm run docker:dev:down

# View logs
npm run docker:logs

# Clean restart
npm run docker:dev:down && npm run docker:dev
```

**Docker Development URLs:**
- **API**: http://localhost:3000
- **API Docs**: http://localhost:3000/api/docs
- **Database**: localhost:5432
- **Redis** (if enabled): localhost:6379

### Hot Reload Feature
Docker development uses modern `develop.watch` for instant hot reload:
- 🔄 **Code changes**: Automatically sync to container
- 🔄 **Package.json changes**: Rebuild container
- 🔄 **Database changes**: Persist between restarts

---

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

### Environment Files Overview

The project includes three environment templates for different deployment scenarios:

| File | Purpose | Usage |
|------|---------|--------|
| `.env.example` | Local development | Copy to `.env` for local PostgreSQL |
| `.env.docker.example` | Docker development | Copy to `.env.docker` for containerized dev |
| `.env.production.example` | Production deployment | Copy to `.env.production` for production |

### Local Development Configuration

For **local development**, copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Key settings for local development:
```bash
NODE_ENV=development
DATABASE_URL="postgresql://keven_user:your_password@localhost:5432/keven_dev_db"
JWT_ACCESS_SECRET="your-super-secure-access-secret-at-least-64-characters-long"
JWT_REFRESH_SECRET="your-super-secure-refresh-secret-different-from-access-secret"
SUPER_ADMIN_EMAIL="admin@example.com"
SWAGGER_ENABLED=true
HOT_RELOAD=true
```

### Docker Development Configuration

For **Docker development**, the system automatically uses `.env.docker.example`:

Key differences for Docker:
```bash
NODE_ENV=development
DATABASE_URL="postgresql://dev_user:dev_password@postgres:5432/keven_dev_db"
REDIS_URL="redis://redis:6379"
# Pre-configured secure JWT secrets for development
# All services connect via Docker network names
```

### Production Configuration

For **production**, copy `.env.production.example` to `.env.production`:

```bash
cp .env.production.example .env.production
```

Critical production settings:
```bash
NODE_ENV=production
DATABASE_URL="postgresql://production_user:secure_password@production_host:5432/keven_production"
JWT_ACCESS_SECRET="CRITICAL_CHANGE_TO_SECURE_64_CHAR_SECRET"
JWT_REFRESH_SECRET="CRITICAL_CHANGE_TO_DIFFERENT_64_CHAR_SECRET"
SWAGGER_ENABLED=false
BCRYPT_SALT_ROUNDS=12
# SSL, SMTP, monitoring, and security configurations
```

### Required Environment Variables (All Environments)

**Critical Variables (Must be set):**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_ACCESS_SECRET` - Access token secret (min 64 characters for production)
- `JWT_REFRESH_SECRET` - Refresh token secret (must be different from access)
- `SUPER_ADMIN_EMAIL` - Email for the Super Admin user

**Important Variables:**
- `NODE_ENV` - Environment mode (development/production)
- `PORT` - Server port (default: 3000)
- `BCRYPT_SALT_ROUNDS` - Password hashing complexity (10 dev, 12+ prod)

### JWT Secret Generation

Generate cryptographically secure JWT secrets:
```bash
# Generate a secure JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Or use online tools (for development only):
# https://www.allkeysgenerator.com/Random/Security-Encryption-Key-Generator.aspx
```

**Security Note:** Never use weak or example secrets in production!

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

### Local Development Commands
```bash
# Development Server
npm run dev              # Start development server with hot reload
npm run build            # Build TypeScript to JavaScript  
npm start                # Start production server

# Setup & Environment
npm run setup:local      # Install deps, migrate, and smart seed
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))" # Generate JWT secret

# Database (Local)
npm run db:migrate       # Run database migrations (creates new migration)
npm run db:deploy        # Apply migrations (non-destructive)
npm run db:seed:check    # Smart seed (only if database is empty)
npm run db:generate      # Generate Prisma client
npm run db:studio        # Open Prisma Studio
npm run db:reset         # Reset database (WARNING: deletes all data)
```

### Docker Development Commands
```bash
# Docker Environment
npm run docker:dev       # Start development with hot reload
npm run docker:dev:down  # Stop all Docker services
npm run docker:logs      # View Docker container logs
npm run docker:prod      # Run production Docker setup

# Docker Database Access
npm run docker:db:studio # Open Prisma Studio in Docker
npm run docker:db:reset  # Reset Docker database (WARNING: deletes all data)

# Docker with Redis Cache
npm run docker:dev --profile redis  # Start with Redis enabled
```

### Code Quality Commands
```bash
npm run lint             # Check ESLint rules
npm run lint:fix         # Fix ESLint issues automatically
npm run format           # Format code with Prettier  
npm run type-check       # Check TypeScript types
```

### Testing Commands (Future Implementation)
```bash
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage
```

### Utility Commands
```bash
# Environment Setup
./setup-local.sh         # Linux/macOS setup script
./setup-local.bat        # Windows setup script

# Manual Docker Commands (if needed)
docker-compose up postgres              # Start only database
docker-compose up --build               # Rebuild and start all
docker-compose logs backend             # View backend logs
docker-compose exec backend npm run db:studio  # Access DB studio in container
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

### Production Docker Deployment (Recommended)

The project includes a production-ready `docker-compose.prod.yml` configuration:

```bash
# 1. Prepare production environment
cp .env.production.example .env.production
# Edit .env.production with secure values

# 2. Deploy with production compose
npm run docker:prod
# or manually:
docker-compose -f docker-compose.prod.yml up -d --build

# 3. View production logs
docker-compose -f docker-compose.prod.yml logs -f backend
```

The production setup includes:
- 🔒 **Security hardening** with non-root user
- 📊 **Resource limits** for memory and CPU  
- 🔍 **Health checks** with proper monitoring
- 🗄️ **Persistent data volumes** for database
- 🚀 **Production optimizations** (disabled Swagger, optimized logging)
- 🔧 **Advanced configuration** (SSL, Redis, monitoring)

### Manual Docker Production

```bash
# Build production image
docker build -t keven-backend-api .

# Run with production environment
docker run -d \
  --name keven-backend \
  -p 3000:3000 \
  --env-file .env.production \
  keven-backend-api
```

### Cloud Platform Deployment

#### 1. **Digital Ocean Apps**
```yaml
# .do/app.yaml
name: keven-backend-api
services:
- name: api
  source_dir: /
  github:
    repo: your-username/keven-backend-template
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: "production"
```

#### 2. **Railway**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway login
railway init
railway up
```

#### 3. **AWS/GCP with Docker**
Use the production `Dockerfile` with managed databases (RDS/Cloud SQL).

### Production Environment Checklist

**Critical Security Setup:**
- [ ] Strong JWT secrets (min 64 characters, cryptographically random)
- [ ] Secure DATABASE_URL with SSL enabled
- [ ] Set NODE_ENV=production
- [ ] Disable SWAGGER_ENABLED in production
- [ ] Use BCRYPT_SALT_ROUNDS=12 or higher
- [ ] Configure secure CORS_ORIGINS (no wildcards)
- [ ] Set up proper SSL certificates (Let's Encrypt or purchased)

**Infrastructure Setup:**
- [ ] Configure reverse proxy (Nginx/Traefik)
- [ ] Set up database backups (automated daily/weekly)
- [ ] Configure log rotation and monitoring
- [ ] Set up rate limiting and DDoS protection
- [ ] Configure health checks and uptime monitoring
- [ ] Set up error tracking (Sentry/Bugsnag)

**Performance & Monitoring:**
- [ ] Set up application monitoring (New Relic/DataDog)
- [ ] Configure performance metrics collection
- [ ] Set up database connection pooling
- [ ] Enable Redis caching for sessions
- [ ] Configure CDN for static assets (if applicable)
- [ ] Set up automated deployment pipeline

**Operational Setup:**
- [ ] Set up staging environment for testing
- [ ] Configure automated database migrations
- [ ] Set up backup and disaster recovery procedures
- [ ] Document incident response procedures
- [ ] Set up team access and permissions

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

## 🔧 Troubleshooting

### Common Development Issues

#### Database Connection Issues
```bash
# Issue: "Database connection failed"
# Solutions:
1. Check if PostgreSQL is running: pg_ctl status
2. Verify DATABASE_URL in .env file
3. Ensure database exists: CREATE DATABASE keven_dev_db;
4. Check user permissions: GRANT ALL PRIVILEGES ON DATABASE keven_dev_db TO keven_user;
```

#### JWT Secret Validation Errors
```bash
# Issue: "JWT secret must be at least 32 characters"
# Solution: Generate secure secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Update JWT_ACCESS_SECRET and JWT_REFRESH_SECRET in .env
```

#### Docker Development Issues
```bash
# Issue: Hot reload not working
# Solutions:
1. Ensure you're using: npm run docker:dev (with --watch)
2. Check Docker version supports compose watch: docker compose version
3. Restart with clean build: npm run docker:dev:down && npm run docker:dev

# Issue: Database data lost on restart
# Solution: This is by design in development. To persist data:
1. Use local development mode instead
2. Or manually backup: docker exec postgres pg_dump -U dev_user keven_dev_db > backup.sql
```

#### Permission System Issues
```bash
# Issue: "Access denied. Required permissions: rbac:read:users"
# Solutions:
1. Check user roles: npm run db:studio -> users -> userRoles
2. Verify token contains permissions: decode JWT at jwt.io
3. Re-seed database: npm run db:reset (WARNING: deletes all data)
4. Check middleware configuration in routes
```

#### Environment Configuration Issues
```bash
# Issue: Wrong environment file being used
# Solutions:
1. Local development: Use .env file (copy from .env.example)
2. Docker development: Use .env.docker file (auto-loaded)
3. Production: Use .env.production file
4. Check NODE_ENV setting matches your environment
```

### Performance Issues

#### Slow API Responses
```bash
# Check database queries with Prisma logging
# Add to .env:
DEBUG="prisma:query"

# Monitor container resources:
docker stats

# Check database connection pool:
# Prisma will show connection issues in logs
```

#### Memory Issues with Docker
```bash
# Check Docker memory usage:
docker stats

# Increase Docker memory limit in Docker Desktop settings
# Or add memory limits to docker-compose.yml
```

### Recovery Commands

```bash
# Complete reset (WARNING: Deletes all data)
npm run docker:dev:down
docker volume prune -f
npm run docker:dev

# Reset just the database
npm run db:reset  # Local
npm run docker:db:reset  # Docker

# Regenerate Prisma client
npm run db:generate

# Check service status
docker-compose ps  # Docker services
pg_ctl status  # Local PostgreSQL
```

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
- **Database persistence** - Use `db:deploy` instead of `db:migrate` to avoid data loss

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