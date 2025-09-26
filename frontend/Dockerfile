# Use Node.js 20+ (required for Vite 7)
FROM node:20

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies (ignore peer conflicts)
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Expose Vite preview port
EXPOSE 4173

# Run Vite preview (serves dist/)
CMD ["npm", "run", "preview", "--", "--host"]
