# Multi-stage Dockerfile for AISteth Medical Billing Platform
# Optimized for Coolify deployment on Hetzner

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

# Generate Prisma client
RUN npx prisma generate

# Build backend TypeScript
RUN npm run build

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

# Copy built backend from builder
COPY --from=backend-builder --chown=nodejs:nodejs /app/backend/dist ./backend/dist
COPY --from=backend-builder --chown=nodejs:nodejs /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder --chown=nodejs:nodejs /app/backend/prisma ./backend/prisma
COPY --from=backend-builder --chown=nodejs:nodejs /app/backend/package*.json ./backend/

# Copy medical billing data (if needed)
COPY --chown=nodejs:nodejs RAG/Codes_by_class.csv ./data/

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV FRONTEND_PORT=3000

# Create necessary directories
RUN mkdir -p /app/backend/uploads /app/backend/logs /app/data && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose ports
EXPOSE 3000 3001

# Health check - use curl for better reliability
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "backend/dist/server.js"]

