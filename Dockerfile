# -- Stage 1: Build frontend --
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# -- Stage 2: Production server --
FROM node:20-alpine AS production
WORKDIR /app

# Install backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

# Copy backend source
COPY backend/ ./backend/

# Copy built frontend into backend public folder
COPY --from=frontend-build /app/frontend/dist ./backend/public

# Expose backend port
EXPOSE 5000

# Environment defaults
ENV NODE_ENV=production
ENV PORT=5000

WORKDIR /app/backend
CMD ["node", "server.js"]
