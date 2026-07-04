# server/Dockerfile — Production-ready Node.js backend
FROM node:18-alpine

WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the rest of the application
COPY . .

# Railway assigns PORT dynamically via environment variable
EXPOSE ${PORT:-5000}

# Production start command
CMD ["node", "index.js"]
