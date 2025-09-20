FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
# Ensure pnpm is available
RUN corepack enable && corepack prepare pnpm@9 --activate

# Install dependencies separately for better caching
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm install --frozen-lockfile

# Build the Next.js app
FROM base AS build
COPY . .
COPY --from=deps /app/node_modules /app/node_modules
RUN pnpm run build

# Production runtime image
FROM node:20-slim AS prod
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@9 --activate

# Copy production node_modules and build artifacts
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=build /app/.next /app/.next
COPY pnpm-lock.yaml ./
COPY package.json ./
COPY next.config.ts tsconfig.json ./

EXPOSE 3000
CMD [ "pnpm", "start" ]