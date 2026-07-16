# Multi-stage build for React frontend
FROM node:22-alpine as builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY scripts/install-deps.sh ./scripts/install-deps.sh

# Install dependencies from the lockfile when available.
RUN ./scripts/install-deps.sh && npm cache clean --force

# Copy source code
COPY . .

# Declare build-time args (values come from docker-compose / root .env — nothing hardcoded here)
ARG REACT_APP_PROJECT_NAME="{{ cookiecutter.project_name }}"
ARG REACT_APP_API_URL
ARG REACT_APP_API_GATEWAY_START_ENDPOINT
ARG REACT_APP_KEEP_ALIVE_INTERVAL
ARG REACT_APP_STARTUP_TIMEOUT
ARG REACT_APP_HEALTH_CHECK_TIMEOUT
ARG REACT_APP_POLLING_INTERVAL
ARG REACT_APP_NAVIGATION_DELAY
ARG REACT_APP_PRIMARY_50
ARG REACT_APP_PRIMARY_100
ARG REACT_APP_PRIMARY_200
ARG REACT_APP_PRIMARY_300
ARG REACT_APP_PRIMARY_400
ARG REACT_APP_PRIMARY_500
ARG REACT_APP_PRIMARY_600
ARG REACT_APP_PRIMARY_700
ARG REACT_APP_PRIMARY_800
ARG REACT_APP_PRIMARY_900

# Expose them as env vars so react-scripts picks them up (shell env overrides .env file)
ENV REACT_APP_PROJECT_NAME=${REACT_APP_PROJECT_NAME}
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
ENV REACT_APP_API_GATEWAY_START_ENDPOINT=${REACT_APP_API_GATEWAY_START_ENDPOINT}
ENV REACT_APP_KEEP_ALIVE_INTERVAL=${REACT_APP_KEEP_ALIVE_INTERVAL}
ENV REACT_APP_STARTUP_TIMEOUT=${REACT_APP_STARTUP_TIMEOUT}
ENV REACT_APP_HEALTH_CHECK_TIMEOUT=${REACT_APP_HEALTH_CHECK_TIMEOUT}
ENV REACT_APP_POLLING_INTERVAL=${REACT_APP_POLLING_INTERVAL}
ENV REACT_APP_NAVIGATION_DELAY=${REACT_APP_NAVIGATION_DELAY}
ENV REACT_APP_PRIMARY_50=${REACT_APP_PRIMARY_50}
ENV REACT_APP_PRIMARY_100=${REACT_APP_PRIMARY_100}
ENV REACT_APP_PRIMARY_200=${REACT_APP_PRIMARY_200}
ENV REACT_APP_PRIMARY_300=${REACT_APP_PRIMARY_300}
ENV REACT_APP_PRIMARY_400=${REACT_APP_PRIMARY_400}
ENV REACT_APP_PRIMARY_500=${REACT_APP_PRIMARY_500}
ENV REACT_APP_PRIMARY_600=${REACT_APP_PRIMARY_600}
ENV REACT_APP_PRIMARY_700=${REACT_APP_PRIMARY_700}
ENV REACT_APP_PRIMARY_800=${REACT_APP_PRIMARY_800}
ENV REACT_APP_PRIMARY_900=${REACT_APP_PRIMARY_900}

# Build the application
RUN npm run build

# Production stage with Nginx
FROM nginx:1.25-alpine as production

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built assets from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx config template (entrypoint will run envsubst on it at startup)
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template

# Remove default nginx configuration
RUN rm -f /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80/health || exit 1

# Use the existing nginx user (UID/GID 101 built into the image)
RUN chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    chown -R nginx:nginx /usr/share/nginx/html && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Switch to non-root user
USER nginx

# Expose port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
