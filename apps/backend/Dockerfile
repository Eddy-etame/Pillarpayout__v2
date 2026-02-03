FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
COPY apps/backend/package*.json apps/backend/
COPY libs libs
COPY apps/backend apps/backend
RUN npm install --workspaces --include-workspace-root
RUN npm --workspace apps/backend run build

CMD ["node", "apps/backend/dist/main.js"]
