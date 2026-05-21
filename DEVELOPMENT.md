# Development Environment Configuration for MASAP-UGANC

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL client tools (optional)

### Local Development Setup

```bash
# Clone and navigate to project
cd /workspace

# Backend setup
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
pip install ruff pytest pytest-cov pytest-asyncio httpx

# Frontend setup
cd ../frontend
npm install

# Start development services
cd ..
docker-compose up -d db
```

## Development Commands

### Backend

```bash
# Activate virtual environment
source backend/.venv/bin/activate

# Run linting
ruff check app tests
ruff format app tests

# Run tests
pytest tests/ -v
pytest tests/ -v --cov=app --cov-report=html

# Run advanced tests
pytest backend/tests/advanced/ -v

# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Database migrations
alembic revision --autogenerate -m "migration message"
alembic upgrade head
```

### Frontend

```bash
cd frontend

# Run linting
npm run lint

# Type checking
npm run type-check

# Development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

### Database

```bash
# Backup database
./scripts/backup.sh full

# Restore from backup
./scripts/restore.sh ./backups/masap_full_YYYYMMDD_HHMMSS.sql.gz

# List backups
./scripts/backup.sh list

# Clean old backups
./scripts/backup.sh clean
```

## Environment Variables

### Backend (.env)

```bash
# Required
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/masap_uganc
SECRET_KEY=your-super-secret-key-minimum-32-characters-long-random
DEBUG=True

# Optional
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480
ALLOWED_ORIGINS=["http://localhost:3000"]
FRONTEND_URL=http://localhost:3000

# Email (for password reset, notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=MASAP-UGANC <noreply@masap-uganc.com>
```

### Frontend (.env.local)

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_APP_NAME=MASAP-UGANC Portal
```

## Code Quality

### Backend Linting & Formatting

```bash
# Check code quality
ruff check app tests

# Auto-fix issues
ruff check app tests --fix

# Format code
ruff format app tests

# Check formatting without changes
ruff format --check app tests
```

### Frontend Linting & Formatting

```bash
# Check and fix linting issues
npm run lint -- --fix

# Type checking
npm run type-check
```

## Testing Strategy

### Backend Tests

```bash
# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ -v --cov=app --cov-report=term-missing

# Run specific test file
pytest tests/test_auth.py -v

# Run advanced tests
pytest backend/tests/advanced/ -v

# Run tests matching pattern
pytest -k "password" -v
```

### Frontend Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

## Docker Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild images
docker-compose build

# Production build
docker-compose -f docker-compose.prod.yml up -d
```

## Common Issues & Solutions

### Port Already in Use

```bash
# Find process using port 8000
lsof -i :8000

# Kill process
kill -9 <PID>
```

### Database Connection Issues

```bash
# Check if database is running
docker-compose ps

# Restart database
docker-compose restart db

# Check database logs
docker-compose logs db
```

### Migration Issues

```bash
# Reset migrations (development only!)
alembic downgrade base
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "description"
```

## Security Best Practices

1. **Never commit `.env` files** - Add to `.gitignore`
2. **Use strong passwords** - The password validator enforces this
3. **Rotate secrets regularly** - Especially `SECRET_KEY`
4. **Keep dependencies updated** - Run `pip install --upgrade` and `npm update` regularly
5. **Review PRs carefully** - Use the CI/CD pipeline

## Performance Tips

### Backend

- Use database indexes for frequently queried columns
- Enable query caching where appropriate
- Use async endpoints for I/O operations
- Profile slow endpoints with `--profile` flag

### Frontend

- Use React Query for efficient data fetching
- Implement proper memoization with `useMemo` and `useCallback`
- Lazy load heavy components
- Optimize images and assets

## Contributing Guidelines

1. Create a feature branch from `develop`
2. Write tests for new features
3. Ensure all tests pass
4. Run linters and formatters
5. Submit a pull request
6. Wait for CI/CD pipeline to pass
7. Get code review approval

## Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Pytest Documentation](https://docs.pytest.org/)
- [Ruff Documentation](https://docs.astral.sh/ruff/)
