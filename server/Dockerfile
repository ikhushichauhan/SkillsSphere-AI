# server/Dockerfile — Production-ready Node.js backend
FROM node:22-alpine

WORKDIR /app

# Copy the entire monorepo (since server depends on ai-ml workspace)
COPY . .

# Install dependencies for all workspaces (needed for local module links)
RUN npm ci --omit=dev

# Render assigns PORT dynamically
EXPOSE ${PORT:-5000}

# The index.js is inside the server folder
CMD ["node", "server/index.js"]
