FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the backend source code
COPY . .

# Build the TypeScript code
RUN npm run build

# Expose port 7860 for Hugging Face Spaces
EXPOSE 7860
ENV PORT=7860

# Start the Node.js application
CMD ["npm", "start"]
