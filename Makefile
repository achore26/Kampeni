.PHONY: help dev dev-down test lint format migrate

help:
	@echo "Kampeni Intelligence Platform — Development Commands"
	@echo ""
	@echo "  make dev          Start all services (docker-compose)"
	@echo "  make dev-down     Stop all services"
	@echo "  make test         Run all tests"
	@echo "  make lint         Lint all code"
	@echo "  make format       Auto-format all code"
	@echo "  make migrate      Run database migrations"
	@echo "  make logs         Tail service logs"

dev:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

dev-down:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml down

logs:
	docker compose logs -f

test:
	cd backend && python -m pytest --cov=. --cov-report=term-missing -v
	cd frontend && npm test -- --watchAll=false

lint:
	cd backend && ruff check . && mypy .
	cd frontend && npm run lint

format:
	cd backend && ruff format . && ruff check --fix .
	cd frontend && npm run format

migrate:
	cd backend && alembic upgrade head
