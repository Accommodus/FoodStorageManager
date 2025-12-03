FROM node:22-bookworm-slim AS build

ARG TARGETPLATFORM
ARG TARGETOS
ARG TARGETARCH

WORKDIR /app

# Copy manifests first so dependency install is cached and only re-runs when they change.
COPY package.json package-lock.json ./
COPY server/package.json server/package.json
COPY client/package.json client/package.json
COPY schema/package.json schema/package.json

RUN npm ci --workspaces

# npm sometimes skips arch-specific optional deps (Rollup/SWC) in multi-arch builds; install them explicitly.
RUN if [ "$TARGETARCH" = "arm64" ]; then \
  npm install --no-save --no-package-lock @rollup/rollup-linux-arm64-gnu @swc/core-linux-arm64-gnu; \
  elif [ "$TARGETARCH" = "amd64" ]; then \
  npm install --no-save --no-package-lock @rollup/rollup-linux-x64-gnu @swc/core-linux-x64-gnu; \
  fi

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

# Install only production dependencies (per-platform)
RUN npm ci --omit=dev --workspaces

COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/client/dist ./client/dist
COPY --from=build /app/schema/dist ./schema/dist

EXPOSE 3000
CMD ["npm", "--workspace=server", "run", "start"]
