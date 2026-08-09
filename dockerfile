# Use a lightweight Node.js base image
FROM node:22-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy dependency manifests first to leverage Docker caching
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy the remaining application source code
COPY . .

# Expose the port your Express app listens on
EXPOSE 3200

# Define the command to launch your backend
CMD ["node", "server.js"]