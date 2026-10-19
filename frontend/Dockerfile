FROM node:22-alpine AS build
# Match frontend/.nvmrc (Node.js 22 LTS).
WORKDIR /app
COPY package*.json ./
RUN npm install --no-audit --no-fund
# Replace with npm ci after a reviewed package-lock.json is committed.
COPY . .
RUN npm run build
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
