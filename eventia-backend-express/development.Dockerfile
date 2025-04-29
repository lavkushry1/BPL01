FROM node:20-alpine

# Install required dependencies for bcrypt
RUN apk add --no-cache python3 make g++

# Create app directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Create directories for tickets and QR codes
RUN mkdir -p public/tickets public/qrcodes

# Expose the API port
EXPOSE 4000

# Start in development mode with hot reload
CMD ["npm", "run", "dev"] 