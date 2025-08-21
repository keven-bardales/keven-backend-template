# Multi-stage Dockerfile for Keven Backend Template
# Stage 1: Builder - Install dependencies and build the application
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Install build dependencies
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Stage 2: Production - Create minimal production image
FROM node:20-alpine AS production

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Install required system dependencies
RUN apk add --no-cache \
    dumb-init \
    curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma

# Create necessary directories
RUN mkdir -p /app/logs && chown -R nodejs:nodejs /app/logs

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Start application using dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]

# Stage 3: Development - Development environment with hot reload
FROM node:20-alpine AS development

# Set environment variables
ENV NODE_ENV=development
ENV PORT=3000

# Install system dependencies including nodemon for watch mode
RUN apk add --no-cache \
    libc6-compat \
    curl \
    git

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev dependencies)
RUN npm ci && npm cache clean --force

# Install additional dev tools globally for better development experience
RUN npm install -g nodemon ts-node typescript

# Generate Prisma client
RUN npx prisma generate

# Copy source code (this layer will be replaced by volume mount in dev)
COPY --chown=nodejs:nodejs . .

# Create necessary directories
RUN mkdir -p /app/logs && \
    mkdir -p /app/dist && \
    chown -R nodejs:nodejs /app/logs /app/dist

# Switch to non-root user
USER nodejs

# Expose ports for app and debugging
EXPOSE 3000 9229

# Development health check with longer timeout for initial build
HEALTHCHECK --interval=30s --timeout=15s --start-period=60s --retries=5 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Start development server with watch mode
CMD ["npm", "run", "dev"]