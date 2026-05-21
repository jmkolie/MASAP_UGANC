# Makefile for MASAP-UGANC Portal
# Simplifies common development and deployment tasks

.PHONY: help install dev test lint build clean docker-up docker-down backup restore

# Default target
help:
	@echo "MASAP-UGANC Portal - Available Commands"
	@echo "========================================"
	@echo ""
	@echo "Development:"
	@echo "  make install       - Install all dependencies"
	@echo "  make dev           - Start development servers"
	@echo "  make dev-backend   - Start backend only"
	@echo "  make dev-frontend  - Start frontend only"
	@echo ""
	@echo "Testing:"
	@echo "  make test          - Run all tests"
	@echo "  make test-backend  - Run backend tests with coverage"
	@echo "  make test-frontend - Run frontend tests"
	@echo ""
	@echo "Code Quality:"
	@echo "  make lint          - Run linters on all code"
	@echo "  make lint-backend  - Run backend linter (ruff)"
	@echo "  make lint-frontend - Run frontend linter (eslint)"
	@echo "  make format        - Format all code"
	@echo ""
	@echo "Database:"
	@echo "  make migrate       - Run database migrations"
	@echo "  make backup        - Create database backup"
	@echo "  make restore       - Restore from latest backup"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-up     - Start all Docker containers"
	@echo "  make docker-down   - Stop all Docker containers"
	@echo "  make docker-build  - Build Docker images"
	@echo "  make docker-logs   - View container logs"
	@echo ""
	@echo "Production:"
	@echo "  make build         - Build for production"
	@echo "  make clean         - Clean build artifacts"
	@echo ""

# Installation
install:
	@echo "Installing backend dependencies..."
	cd backend && pip install -r requirements.txt
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo "Installation complete!"

# Development
dev:
	@echo "Starting development environment..."
	docker-compose up -d db
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
	cd frontend && npm run dev

dev-backend:
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-frontend:
	cd frontend && npm run dev

# Testing
test: test-backend test-frontend

test-backend:
	cd backend && pytest tests/ -v --cov=app --cov-report=term-missing

test-frontend:
	cd frontend && npm run test

# Linting
lint: lint-backend lint-frontend

lint-backend:
	cd backend && ruff check app tests

lint-frontend:
	cd frontend && npm run lint

# Formatting
format:
	cd backend && ruff format app tests
	cd frontend && npm run lint -- --fix

# Database
migrate:
	cd backend && alembic upgrade head

backup:
	./scripts/backup.sh full

restore:
	@echo "Available backups:"
	@ls -lh ./backups/*.sql* 2>/dev/null || echo "No backups found"
	@read -p "Enter backup file to restore: " file; ./scripts/restore.sh $$file

# Docker
docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-build:
	docker-compose build

docker-logs:
	docker-compose logs -f

# Production build
build:
	@echo "Building backend..."
	cd backend && python -m compileall app
	@echo "Building frontend..."
	cd frontend && npm run build
	@echo "Build complete!"

# Clean
clean:
	@echo "Cleaning build artifacts..."
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".coverage" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "htmlcov" -exec rm -rf {} + 2>/dev/null || true
	cd frontend && rm -rf .next out node_modules 2>/dev/null || true
	cd backend && rm -rf test.db 2>/dev/null || true
	@echo "Clean complete!"

# Security check
security-check:
	@echo "Running security checks..."
	cd backend && pip-audit || echo "pip-audit not installed, skipping..."
	cd frontend && npm audit || echo "npm audit completed with warnings"

# Initialize development environment
init-dev: install
	@echo "Setting up development environment..."
	cp -n backend/.env.example backend/.env 2>/dev/null || true
	cp -n frontend/.env.local.example frontend/.env.local 2>/dev/null || true
	docker-compose up -d db
	sleep 5
	make migrate
	@echo "Development environment ready!"
