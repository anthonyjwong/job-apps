# Makefile for job-apps project

.PHONY: dev prod stop clean

# Start development environment

dev:
	docker compose -f docker-compose.dev.yml up --build

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
