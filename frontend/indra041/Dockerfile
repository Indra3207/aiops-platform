# Stage 1: Build the React app
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Build args become env vars at build time (React bakes them in)
ARG REACT_APP_SUPABASE_URL
ARG REACT_APP_SUPABASE_ANON_KEY
ARG REACT_APP_API_URL
ARG REACT_APP_WS_URL

RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Copy built React app to nginx html directory
COPY --from=build /app/build /usr/share/nginx/html

# Custom nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
