# Multi-stage Dockerfile for AISteth Medical Billing Platform
# Optimized for Coolify deployment on Hetzner
# v1.1 - With curl and resilient startup

# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install frontend dependencies
RUN npm install --prefer-offline --no-audit

# Copy frontend source code
COPY frontend/ ./

# Build frontend for production
RUN npm run build

# Stage 2: Build Backend
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Install backend dependencies
RUN npm install --prefer-offline --no-audit

# Copy backend source code
COPY backend/ ./

# Skip Prisma generation and TS build for simple server
# RUN npx prisma generate
# RUN npm run build

# Stage 3: Production Image
FROM node:20-alpine AS production

# Install dumb-init and curl for proper signal handling and health checks
RUN apk add --no-cache dumb-init curl

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy built frontend from builder
COPY --from=frontend-builder --chown=nodejs:nodejs /app/frontend/dist ./frontend/dist

# Copy backend files
COPY --from=backend-builder --chown=nodejs:nodejs /app/backend/package*.json ./backend/
COPY --from=backend-builder --chown=nodejs:nodejs /app/backend/node_modules ./backend/node_modules
# Copy the simple server script
COPY --from=backend-builder --chown=nodejs:nodejs /app/backend/simple-rag-server.js ./backend/simple-rag-server.js

# Copy medical billing data
COPY --chown=nodejs:nodejs Codes\ by\ class.csv ./
# Set environment variables
ENV NODE_ENV=production
ENV PORT=3002

# Create necessary directories
RUN mkdir -p /app/backend/uploads /app/backend/logs /app/data && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose ports
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3002/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "backend/simple-rag-server.js"]

