# Docker Deployment Guide

This guide covers how to deploy the Keven Backend Template using Docker and Docker Compose.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 2GB RAM
- At least 5GB disk space

## Quick Start

### Development Environment

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd keven-backend-template
   ```

2. **Start development environment:**
   ```bash
   # Start PostgreSQL database only
   docker-compose up postgres

   # Or start with Redis (optional)
   docker-compose --profile with-redis up postgres redis

   # Start development server with hot reload
   docker-compose --profile dev up
   ```

3. **Access the application:**
   - API: http://localhost:3000/api
   - Health Check: http://localhost:3000/api/health
   - API Documentation: http://localhost:3000/api/docs

### Production Environment

1. **Setup environment variables:**
   ```bash
   cp .env.docker.example .env
   # Edit .env with your production values
   ```

2. **Deploy production stack:**
   ```bash
   # Basic production deployment
   docker-compose -f docker-compose.prod.yml up -d

   # With Nginx reverse proxy
   docker-compose -f docker-compose.prod.yml --profile with-nginx up -d
   ```

3. **Run database migrations:**
   ```bash
   docker-compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
   ```

4. **Seed the database (optional):**
   ```bash
   docker-compose -f docker-compose.prod.yml exec app npx prisma db seed
   ```

## Docker Images

### Multi-Stage Build

The Dockerfile uses a multi-stage build process:

1. **Builder Stage**: Installs dependencies and builds the application
2. **Production Stage**: Creates minimal production image with only necessary files
3. **Development Stage**: Full development environment with hot reload

### Available Targets

```bash
# Build development image
docker build --target development -t keven-backend:dev .

# Build production image
docker build --target production -t keven-backend:prod .
```

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `development` | No |
| `PORT` | Application port | `3000` | No |
| `DATABASE_URL` | PostgreSQL connection string | - | Yes |
| `JWT_SECRET` | JWT signing secret | - | Yes |
| `JWT_REFRESH_SECRET` | Refresh token secret | - | Yes |
| `POSTGRES_USER` | Database username | `user` | No |
| `POSTGRES_PASSWORD` | Database password | `password` | No |
| `POSTGRES_DB` | Database name | `starter_db` | No |

### Docker Compose Profiles

| Profile | Services | Use Case |
|---------|----------|----------|
| `dev` | postgres, app-dev | Development with hot reload |
| `prod` | postgres, app-prod | Production deployment |
| `with-redis` | + redis | Add Redis caching |
| `with-nginx` | + nginx | Add reverse proxy |

## Commands

### Development Commands

```bash
# Start development environment
docker-compose --profile dev up

# View logs
docker-compose logs -f app-dev

# Execute commands in container
docker-compose exec app-dev npm run test
docker-compose exec app-dev npx prisma studio

# Stop services
docker-compose down
```

### Production Commands

```bash
# Deploy production
docker-compose -f docker-compose.prod.yml up -d

# Scale application
docker-compose -f docker-compose.prod.yml up -d --scale app=3

# Update application
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d --no-deps app

# Backup database
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U user starter_db > backup.sql

# View production logs
docker-compose -f docker-compose.prod.yml logs -f app
```

## Health Checks

### Application Health
- **Endpoint**: `/api/health`
- **Interval**: 30 seconds
- **Timeout**: 10 seconds
- **Retries**: 3

### Database Health
- **Command**: `pg_isready`
- **Interval**: 30 seconds
- **Timeout**: 10 seconds
- **Retries**: 5

### Redis Health
- **Command**: `redis-cli ping`
- **Interval**: 30 seconds
- **Timeout**: 10 seconds
- **Retries**: 5

## Security

### Security Features

1. **Non-root user**: Application runs as non-root user (nodejs:1001)
2. **Minimal base image**: Alpine Linux for smaller attack surface
3. **Security headers**: Helmet middleware with comprehensive headers
4. **Rate limiting**: Express rate limit with Redis backing
5. **HTTPS ready**: SSL configuration available in Nginx

### Security Recommendations

1. **Change default passwords** in environment variables
2. **Use secrets management** for production credentials
3. **Enable SSL/TLS** with valid certificates
4. **Configure firewall** to restrict access
5. **Regular updates** of base images and dependencies

## Performance

### Resource Limits

| Service | Memory Limit | Memory Reservation | CPU Limit |
|---------|-------------|-------------------|-----------|
| App | 1GB | 512MB | 1.0 |
| PostgreSQL | 512MB | 256MB | - |
| Redis | 256MB | 128MB | - |

### Performance Tuning

1. **Database connections**: Configure Prisma connection pool
2. **Memory usage**: Monitor and adjust Node.js heap size
3. **Caching**: Implement Redis caching for frequently accessed data
4. **Load balancing**: Use multiple app instances behind Nginx

## Monitoring

### Logs

```bash
# Application logs
docker-compose logs -f app

# Database logs
docker-compose logs -f postgres

# All services
docker-compose logs -f
```

### Metrics

- **Health endpoints**: Built-in health checks
- **Docker stats**: `docker stats`
- **Resource usage**: Monitor CPU, memory, and disk usage

## Troubleshooting

### Common Issues

1. **Port already in use**:
   ```bash
   # Change ports in docker-compose.yml or stop conflicting services
   lsof -ti:3000 | xargs kill -9
   ```

2. **Database connection issues**:
   ```bash
   # Check database health
   docker-compose exec postgres pg_isready -U user -d starter_db
   
   # View database logs
   docker-compose logs postgres
   ```

3. **Build failures**:
   ```bash
   # Clean build cache
   docker builder prune
   
   # Rebuild without cache
   docker-compose build --no-cache
   ```

4. **Permission issues**:
   ```bash
   # Fix volume permissions
   docker-compose down
   docker volume rm $(docker volume ls -q)
   docker-compose up
   ```

### Debug Mode

```bash
# Run with debug logs
NODE_ENV=development docker-compose up

# Access container shell
docker-compose exec app sh

# Check application status
docker-compose exec app npm run health-check
```

## Backup and Recovery

### Database Backup

```bash
# Create backup
docker-compose exec postgres pg_dump -U user starter_db > backup-$(date +%Y%m%d).sql

# Restore backup
docker-compose exec -T postgres psql -U user -d starter_db < backup-20240101.sql
```

### Volume Backup

```bash
# Backup volumes
docker run --rm -v keven-backend-template_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-data.tar.gz -C /data .

# Restore volumes
docker run --rm -v keven-backend-template_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres-data.tar.gz -C /data
```

## Scaling

### Horizontal Scaling

```bash
# Scale application instances
docker-compose -f docker-compose.prod.yml up -d --scale app=3

# Use with load balancer (Nginx)
docker-compose -f docker-compose.prod.yml --profile with-nginx up -d --scale app=3
```

### Vertical Scaling

Adjust resource limits in `docker-compose.prod.yml`:

```yaml
deploy:
  resources:
    limits:
      memory: 2G
      cpus: '2.0'
```

## Deployment Strategies

### Blue-Green Deployment

1. Deploy new version to different port
2. Test new version
3. Switch traffic to new version
4. Remove old version

### Rolling Updates

```bash
# Update with zero downtime
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d --no-deps app
```

## Best Practices

1. **Use specific image tags** in production
2. **Implement proper logging** strategy
3. **Monitor resource usage** continuously
4. **Backup data regularly**
5. **Test disaster recovery** procedures
6. **Keep images updated** with security patches
7. **Use secrets management** for sensitive data
8. **Configure log rotation** to prevent disk full
9. **Implement proper monitoring** and alerting
10. **Document custom configurations**