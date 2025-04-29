FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose the port
EXPOSE 5173

# Start in development mode with hot reload
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"] 