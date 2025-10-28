# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Environment Setup

This project uses **uv** for Python package management. Install dependencies and activate the virtual environment:

```bash
uv sync
source .venv/bin/activate
```

Ensure your editor uses the interpreter at `backend/.venv/bin/python`.

## Docker Development

The preferred development method uses Docker Compose (see ../development.md for full setup):

```bash
docker compose watch
```

This provides live code reloading in containers. For an interactive shell in the running backend container:

```bash
docker compose exec backend bash
```

## Common Commands

### Testing
- **Run all tests**: `bash ./scripts/test.sh`
- **Run tests with coverage report**: `bash ./scripts/test.sh` (generates htmlcov/index.html)
- **Run tests with custom pytest args**: `docker compose exec backend bash scripts/tests-start.sh -x`
- **Run tests in running container**: `docker compose exec backend bash scripts/tests-start.sh`

### Code Quality
- **Format code**: `bash ./scripts/format.sh` (uses ruff format)
- **Lint code**: `bash ./scripts/lint.sh` (uses mypy, ruff check, ruff format check)
- **Type checking**: `mypy app`
- **Auto-fix linting issues**: `ruff check app scripts --fix && ruff format app scripts`

### Database Migrations
Inside the backend container (use `docker compose exec backend bash`):

```bash
# Create migration
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head
```

The project uses SQLModel for database models (in `app/models.py`) and Alembic for migrations. Model changes require explicit migration creation and application.

### Running the Application
- **Development with reload**: `fastapi run --reload app/main.py`
- **Production**: `fastapi run --workers 4 app/main.py` (default Docker command)

## Architecture Overview

### Core Structure
- **FastAPI** application with modular routing in `app/api/`
- **SQLModel** for database ORM with models in `app/models.py`
- **Alembic** for database migrations with configurations in `app/alembic/`
- **Pydantic** settings management in `app/core/config.py`

### Key Directories
- `app/api/routes/` - API endpoint definitions (users, items, login, utils, private)
- `app/core/` - Core functionality (database, security, config)
- `app/crud.py` - Database CRUD operations
- `app/utils.py` - Utility functions for email, JWT tokens
- `app/tests/` - Test suite using pytest
- `scripts/` - Development and deployment scripts
- `app/email-templates/` - Email templates (src for MJML, build for HTML)

### Authentication & Security
- JWT-based authentication using `app/core/security.py`
- Password hashing with bcrypt
- Email-based password reset functionality
- CORS middleware configured via settings

### Database Design
- PostgreSQL with psycopg driver
- UUID primary keys for all models
- User-Item relationship with cascade delete
- Models include User, Item with full CRUD support

### Configuration
- Environment variables via `.env` file (parent directory)
- Pydantic Settings in `app/core/config.py`
- Different configurations for local/staging/production
- SMTP configuration for email functionality

### Email System
- Template-based emails using Jinja2
- MJML templates in `app/email-templates/src/`
- Built HTML templates in `app/email-templates/build/`
- Supports test emails, password reset, and new account notifications

### Testing Strategy
- pytest framework with coverage reporting
- Test utilities in `app/tests/utils/`
- Separate test configurations for local development
- Database setup via `app/tests_pre_start.py`

## Environment Variables

Key configuration is managed through environment variables in a parent `.env` file:

- `POSTGRES_SERVER`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` - Database connection
- `SECRET_KEY` - JWT signing (must be changed from default)
- `FIRST_SUPERUSER`, `FIRST_SUPERUSER_PASSWORD` - Admin account setup
- `SMTP_*` variables for email functionality
- `FRONTEND_HOST` - CORS configuration
- `SENTRY_DSN` - Error tracking (optional)