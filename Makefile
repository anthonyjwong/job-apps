.DEFAULT_GOAL := dev

.PHONY: dev prod backend stop clean lint lint-backend lint-frontend format-backend

# Start development environment
dev:
	docker compose -f docker-compose.dev.yml up

backend:
	docker compose -f docker-compose.dev.yml up -d db redis worker backend

# Start production environment
prod:
	docker compose -f docker-compose.prod.yml up

# Stop all running containers
stop:
	docker compose -f docker-compose.dev.yml down
	[ -f docker-compose.prod.yml ] && docker compose -f docker-compose.prod.yml down || true

# Remove all containers and images
clean:
	docker compose -f docker-compose.dev.yml down --rmi all --remove-orphans
	[ -f docker-compose.prod.yml ] && docker compose -f docker-compose.prod.yml down --rmi all --remove-orphans || true
	docker image prune -af || true

reset-cache:
	docker compose -f docker-compose.dev.yml down --rmi all --remove-orphans
	[ -f docker-compose.prod.yml ] && docker compose -f docker-compose.prod.yml down --rmi all --remove-orphans || true
	docker builder prune -af || true

# Alembic: generates files in local workspace and runs against the db container
revision:
	docker compose -f docker-compose.dev.yml run --rm -v $$PWD/backend:/app -w /app backend alembic revision --autogenerate -m "${m}"

upgrade:
	docker compose -f docker-compose.dev.yml run --rm -v $$PWD/backend:/app -w /app backend alembic upgrade head

downgrade:
	docker compose -f docker-compose.dev.yml run --rm -v $$PWD/backend:/app -w /app backend alembic downgrade -1

# Lint aggregate target
lint: lint-backend lint-frontend ## Lint both backend and frontend

# Backend linting: ruff (fix/remove unused), black (format), mypy (types)
lint-backend:
	cd backend && \
	poetry run ruff check --fix . && \
	poetry run black . && \
	poetry run mypy . && \
	cd ..

# Frontend linting: ESLint (fix, remove unused imports/vars)
lint-frontend:
	cd frontend && pnpm run lint:fix && cd ..