# ==========================================
# STAGE 1: Build environment
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy codebase
COPY . .

# Run production build compilation (bundles both client SPA and Express/MCP servers)
RUN npm run build

# ==========================================
# STAGE 2: Light runtime environment
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Install production-only dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy compiled bundles and assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/skills ./skills
COPY --from=builder /app/package.json ./package.json

# Expose single standard ingress port
EXPOSE 3000

# Start server bundle directly
CMD ["npm", "run", "start"]
