FROM node:20-slim
ENV PNPM_HOME="/pnpm" \
    PATH="/pnpm:$PATH" \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=development
WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

# Copy only manifest files first (dependency layer)
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm install --frozen-lockfile

# Copy source (mounted at runtime too, but needed for initial install completeness)
COPY . .

EXPOSE 3000
CMD ["pnpm", "dev"]