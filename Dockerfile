FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY server/package.json server/package.json
COPY client/package.json client/package.json
COPY schema/package.json schema/package.json
RUN npm ci

# Copy the rest of the source and build the workspaces
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV S_PORT=3000

# Manifests so npm can install production deps for the workspaces
COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/server/package.json /app/server/package.json
COPY --from=build /app/client/package.json /app/client/package.json
COPY --from=build /app/schema/package.json /app/schema/package.json

# Install only prod deps
RUN npm ci --omit=dev

COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/client/dist ./client/dist
COPY --from=build /app/schema/dist ./schema/dist

EXPOSE 3000
CMD ["npm", "--workspace=server", "run", "start"]
