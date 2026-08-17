# syntax=docker/dockerfile:1

# ---------- builder: produce the static Vite build ----------
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .

# Vite bakes import.meta.env.VITE_* values into the bundle at build time —
# they must come in as build args, not just runtime env vars. Default
# matches src/lib/api.js's own fallback (http://localhost:8000), i.e. the
# backend's HOST-mapped port, since this code runs in the user's browser,
# not inside the Docker network (browsers can't resolve service name
# "backend" — only the host machine's own localhost:8000 mapping).
ARG VITE_API_BASE_URL="http://localhost:8000"
ARG VITE_ADMIN_EMAIL="admin@medical.local"
ARG VITE_ADMIN_PASSWORD="admin123"
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_ADMIN_EMAIL=$VITE_ADMIN_EMAIL \
    VITE_ADMIN_PASSWORD=$VITE_ADMIN_PASSWORD

RUN npm run build

# ---------- runner: serve the static build with nginx ----------
FROM nginx:1.27-alpine AS runner
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
