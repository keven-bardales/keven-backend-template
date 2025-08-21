# Docker Development Environment

This document describes how to set up and use the Docker-based development environment for the Keven Backend Template.

## 🚀 Quick Start

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- Git (for cloning the repository)

### One-Command Setup

**Linux/macOS:**
```bash
chmod +x dev-setup.sh
./dev-setup.sh start
```

**Windows:**
```cmd
dev-setup.bat start
```

This will:
1. Create necessary directories and environment file
2. Build and start all development services
3. Run database migrations
4. Seed the database with initial data

## 📋 Available Services

After running the setup, the following services will be available:

| Service | URL | Description |
|---------|-----|-------------|
| **Backend API** | http://localhost:3000 | Main API server with hot reload |
| **API Documentation** | http://localhost:3000/api/docs | Interactive Swagger documentation |
| **Health Check** | http://localhost:3000/api/health | Service health status |
| **Database (Adminer)** | http://localhost:8080 | Web-based database management |
| **Redis Commander** | http://localhost:8081 | Redis management interface |

## 🐳 Docker Compose Files

The project includes multiple Docker Compose configurations:

- `docker-compose.yml` - Base configuration with development and production profiles
- `docker-compose.dev.yml` - Dedicated development environment with tools
- `docker-compose.prod.yml` - Production configuration

## 🔧 Development Commands

### Setup Scripts

| Command | Linux/macOS | Windows | Description |
|---------|-------------|---------|-------------|
| Start | `./dev-setup.sh start` | `dev-setup.bat start` | Start development environment |
| Stop | `./dev-setup.sh stop` | `dev-setup.bat stop` | Stop all services |
| Restart | `./dev-setup.sh restart` | `dev-setup.bat restart` | Restart services |
| Clean | `./dev-setup.sh clean` | `dev-setup.bat clean` | Remove containers and volumes |
| Logs | `./dev-setup.sh logs` | `dev-setup.bat logs` | View backend logs |
| Tools | `./dev-setup.sh tools` | `dev-setup.bat tools` | Start database management tools |

### Manual Docker Compose Commands

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# Start with database tools
docker-compose -f docker-compose.dev.yml --profile tools up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f backend-dev

# Stop services
docker-compose -f docker-compose.dev.yml down

# Rebuild and restart
docker-compose -f docker-compose.dev.yml up --build -d

# Clean everything
docker-compose -f docker-compose.dev.yml down -v
```

## 🗂️ Directory Structure

The Docker setup creates and uses the following directories:

```
├── database/           # Database initialization scripts
│   └── init-dev.sql   # Development database setup
├── logs/              # Application logs (mounted volume)
├── .env.dev           # Development environment variables
├── docker-compose.dev.yml  # Development Docker Compose
├── dev-setup.sh       # Linux/macOS setup script
├── dev-setup.bat      # Windows setup script
└── Dockerfile         # Multi-stage Docker build
```

## 🔑 Environment Variables

The development environment uses the following key variables (in `.env.dev`):

### Database
- `DATABASE_URL` - PostgreSQL connection string
- `POSTGRES_USER` - Database username (dev_user)
- `POSTGRES_PASSWORD` - Database password (dev_password)
- `POSTGRES_DB` - Database name (keven_dev_db)

### Authentication
- `JWT_ACCESS_SECRET` - JWT access token secret
- `JWT_REFRESH_SECRET` - JWT refresh token secret
- `JWT_ACCESS_EXPIRES_IN` - Access token expiry (15m)
- `JWT_REFRESH_EXPIRES_IN` - Refresh token expiry (7d)

### API Configuration
- `PORT` - Application port (3000)
- `CORS_ORIGINS` - Allowed CORS origins
- `SWAGGER_ENABLED` - Enable API documentation (true)

## 🏗️ Development Features

### Hot Reload
- Source code changes trigger automatic rebuilds
- No need to restart containers for code changes
- TypeScript compilation happens automatically

### Database Management
- **Adminer** at http://localhost:8080
  - Server: `postgres-dev`
  - Username: `dev_user`
  - Password: `dev_password`
  - Database: `keven_dev_db`

### Redis Management
- **Redis Commander** at http://localhost:8081
  - Username: `admin`
  - Password: `dev_password`

### Debugging
- Node.js debugger port exposed on `9229`
- VSCode debugging configuration supported
- Comprehensive logging with configurable levels

## 🔍 Health Checks

All services include health checks:

- **Backend**: Checks API health endpoint
- **PostgreSQL**: Checks database connectivity
- **Redis**: Checks Redis ping response

Health status can be monitored with:
```bash
docker-compose -f docker-compose.dev.yml ps
```

## 📊 Monitoring and Logs

### View Service Logs
```bash
# Backend logs
docker-compose -f docker-compose.dev.yml logs -f backend-dev

# Database logs
docker-compose -f docker-compose.dev.yml logs -f postgres-dev

# All logs
docker-compose -f docker-compose.dev.yml logs -f
```

### Log Files
- Application logs are written to `./logs/` directory
- Structured JSON logging in development
- Different log levels: debug, info, warn, error

## 🚨 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Check what's using the port
netstat -tulpn | grep :3000

# Stop conflicting services
docker-compose -f docker-compose.dev.yml down
```

#### Database Connection Issues
```bash
# Check database health
docker-compose -f docker-compose.dev.yml exec postgres-dev pg_isready -U dev_user

# Reset database
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d postgres-dev
```

#### Container Build Issues
```bash
# Rebuild without cache
docker-compose -f docker-compose.dev.yml build --no-cache

# Clean Docker system
docker system prune -af
```

### Service Status
Check if all services are healthy:
```bash
docker-compose -f docker-compose.dev.yml ps
```

### Database Access
Connect directly to the database:
```bash
docker-compose -f docker-compose.dev.yml exec postgres-dev psql -U dev_user -d keven_dev_db
```

## 🔄 Database Operations

### Migrations
```bash
# Run migrations
docker-compose -f docker-compose.dev.yml exec backend-dev npm run db:migrate

# Reset database
docker-compose -f docker-compose.dev.yml exec backend-dev npm run db:reset

# Generate Prisma client
docker-compose -f docker-compose.dev.yml exec backend-dev npx prisma generate
```

### Seeding
```bash
# Seed database
docker-compose -f docker-compose.dev.yml exec backend-dev npm run db:seed

# Open Prisma Studio
docker-compose -f docker-compose.dev.yml exec backend-dev npx prisma studio
```

## 🎯 Development Workflow

1. **Start Development Environment**
   ```bash
   ./dev-setup.sh start  # Linux/macOS
   dev-setup.bat start   # Windows
   ```

2. **Make Code Changes**
   - Edit source files in `src/`
   - Changes are automatically detected and recompiled
   - API server restarts automatically

3. **Test API**
   - Use Swagger UI: http://localhost:3000/api/docs
   - Test endpoints with your frontend or Postman
   - Monitor logs: `./dev-setup.sh logs`

4. **Database Operations**
   - Use Adminer: http://localhost:8080
   - Run migrations when needed
   - Seed test data as required

5. **Clean Up**
   ```bash
   ./dev-setup.sh clean  # Remove everything
   ```

## 🔐 Security Notes

- **Development Only**: The provided secrets and passwords are for development only
- **Never Use in Production**: Always use strong, unique secrets in production
- **Local Access**: Services are bound to localhost by default
- **Network Isolation**: Services run in isolated Docker networks

## 📝 Next Steps

1. Start the development environment
2. Visit http://localhost:3000/api/docs to explore the API
3. Connect your frontend application to http://localhost:3000
4. Use the database management tools for data operations
5. Check the logs for debugging information

For production deployment, see `docker-compose.prod.yml` and the deployment documentation.