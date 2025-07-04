# slotty/Dockerfile
FROM node:18 AS build

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json tsconfig.json vite.config.mjs ./
COPY src ./src
COPY public ./public

RUN npm install
RUN npm run build

# Use a lightweight web server for serving the built files
FROM nginx:alpine AS production

# Copy built files to nginx
COPY --from=build /app/docs /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
