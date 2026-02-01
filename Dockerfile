# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies
RUN npm ci

# Copy source code
COPY shared/ ./shared/
COPY server/ ./server/
COPY client/ ./client/
COPY tsconfig.json ./

# Build all packages (shared must be built first)
RUN npm run build -w shared && \
    npm run build -w server && \
    npm run build -w client

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY server/package*.json ./server/

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built files
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/shared/package.json ./shared/
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/dist ./client/dist

# Set environment
ENV NODE_ENV=production
ENV PORT=3001

# Expose port
EXPOSE 3001

# Start server
CMD ["node", "server/dist/index.js"]
