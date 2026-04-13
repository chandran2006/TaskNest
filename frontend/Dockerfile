FROM node:18-alpine

WORKDIR /app

# Install all deps (including devDeps needed for build)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

EXPOSE 5173

CMD ["npm", "run", "preview"]
