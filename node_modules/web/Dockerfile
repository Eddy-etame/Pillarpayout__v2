FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
COPY apps/web/package*.json apps/web/
COPY libs libs
COPY apps/web apps/web
RUN npm install --workspaces --include-workspace-root
RUN npm --workspace apps/web run build

FROM nginx:alpine
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
COPY apps/web/package*.json apps/web/
COPY libs libs
COPY apps/web apps/web
RUN npm install --workspaces --include-workspace-root
RUN npm --workspace apps/web run build

FROM nginx:alpine
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
