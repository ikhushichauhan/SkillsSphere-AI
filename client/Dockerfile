# client/Dockerfile — Multi-stage production build
# Stage 1: Build the React app
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build args for injecting API URLs at build time
ARG VITE_API_URL
ARG VITE_SOCKET_URL

RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Railway assigns PORT dynamically; nginx must listen on it
# Default to 80 if not set
EXPOSE ${PORT:-80}

# Use envsubst to inject PORT into nginx config at runtime
CMD sh -c "envsubst '\$PORT' < /etc/nginx/conf.d/default.conf > /tmp/default.conf && mv /tmp/default.conf /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"
