FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
COPY apps/gateway/package*.json apps/gateway/
COPY libs libs
COPY apps/gateway apps/gateway
RUN npm install --workspaces --include-workspace-root
RUN npm --workspace apps/gateway run build

CMD ["node", "apps/gateway/dist/main.js"]
