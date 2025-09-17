.DEFAULT_GOAL := dev

.PHONY: dev prod backend stop clean

# Start development environment
dev:
	docker compose -f docker-compose.dev.yml up --build

backend:
	docker compose -f docker-compose.dev.yml up -d db redis worker backend

# Start production environment
prod:
	docker compose -f docker-compose.prod.yml up --build

# Stop all running containers
stop:
	docker compose -f docker-compose.dev.yml down
	docker compose -f docker-compose.prod.yml down

# Remove all containers and images
clean:
	docker compose -f docker-compose.dev.yml down --rmi all --remove-orphans
	docker compose -f docker-compose.prod.yml down --rmi all --remove-orphans
	docker image prune -f || true

# Alembic: generates files in local workspace and runs against the db container
revision:
	docker compose -f docker-compose.dev.yml run --rm -v $$PWD/backend:/app -w /app backend alembic revision --autogenerate -m "${m}"

upgrade:
	docker compose -f docker-compose.dev.yml run --rm -v $$PWD/backend:/app -w /app backend alembic upgrade head

downgrade:
	docker compose -f docker-compose.dev.yml run --rm -v $$PWD/backend:/app -w /app backend alembic downgrade -1