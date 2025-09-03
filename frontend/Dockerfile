FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
WORKDIR /app
# Ensure pnpm is available
RUN corepack enable && corepack prepare pnpm@9 --activate

# Install dependencies separately for better caching
FROM base AS deps
COPY package.json ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm install --frozen-lockfile=false

# Build the Next.js app
FROM base AS build
COPY . .
COPY --from=deps /app/node_modules /app/node_modules
RUN pnpm run build

# Development runtime image
FROM node:20-slim AS dev
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
WORKDIR /app
ENV NODE_ENV=development
RUN corepack enable && corepack prepare pnpm@9 --activate

# Copy node_modules and build artifacts
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=build /app/.next /app/.next
COPY pnpm-lock.yaml ./
COPY package.json ./
COPY public ./public
COPY next.config.ts tsconfig.json ./

EXPOSE 3000
CMD [ "pnpm", "start" ]