FROM node:20-alpine

WORKDIR /app

# Copy the backend package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci

# Copy the entire backend directory
COPY backend/ ./

# Build the TypeScript code
RUN npm run build

# Expose port 7860 (required for Hugging Face Spaces)
EXPOSE 7860
ENV PORT=7860

# Start the Node.js application
CMD ["npm", "start"]
