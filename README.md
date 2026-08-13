![Template preview](docs/template-preview.svg)

# Full-Stack Web Application Cookiecutter Template

A production-ready Cookiecutter template for full-stack web applications featuring:

- **Backend**: Django REST Framework with WebSocket support (Channels) and background tasks (Celery)
- **Frontend**: React 19 with TypeScript, Redux Toolkit, and Tailwind CSS
- **Infrastructure**: AWS (Terraform) with ECS Fargate, RDS, ElastiCache, S3, CloudFront
- **DevOps**: Docker Compose, production Dockerfiles, deployment scripts
- **Optional**: AI integration (OpenAI/Anthropic SDK)

## Quick Start

### Prerequisites

- Python 3.8+ with `cookiecutter` installed
- Docker and Docker Compose
- Node.js 20+
- AWS CLI + Terraform (for infrastructure provisioning)

### Generate Your Project

```bash
# Install cookiecutter if needed
pip install cookiecutter

# Generate from GitHub
cookiecutter gh:unknowncoder05/BaseEphemeralCookieCutter

# Or from a local directory
cookiecutter /path/to/BaseEphemeralCookieCutter
```

### Template Variables

| Variable | Default | Description |
|---|---|---|
| `project_name` | {{cookiecutter.project_name}} | Human-readable project name |
| `project_slug` | `my_project` | Python/directory-friendly name (auto-generated) |
| `project_slug_dashed` | `my-project` | URL/Docker-friendly name (auto-generated) |
| `description` | A full-stack web application | Project description |
| `author_name` | Your Name | Author's name |
| `author_email` | your@email.com | Author's email |
| `domain_name` | example.com | Production domain name |
| `aws_region` | us-east-1 | AWS region for deployment |
| `timezone` | America/New_York | Default timezone |
| `use_ai_integration` | y | Include OpenAI/Anthropic SDK dependencies (y/n) |
| `use_github_integration` | y | Include GitHub OAuth integration (y/n) |
| `python_version` | 3.11 | Python version to use in Docker/CI |
| `node_version` | 20 | Node.js version for Docker images |

## Generated Project Structure

```
<project_slug>/
├── README.md                # Root overview, architecture, all routes & endpoints
├── BackEndApi/              # Django REST backend
│   ├── src/
│   │   ├── api/
│   │   │   ├── items/      # Removable scaffold CRUD module — use as pattern for new modules
│   │   │   ├── users/      # Authentication, profiles, GitHub OAuth
│   │   │   ├── ws/         # WebSocket consumer
│   │   │   └── utils/      # Health check, keep-alive
│   │   └── config/         # Django settings, URLs, Celery config, ASGI/WSGI
│   ├── compose/            # Docker configurations
│   │   ├── local/          # Django, Celery, Nginx for local dev
│   │   └── production/     # Production-hardened config
│   ├── requirements/       # base.txt · local.txt · production.txt
│   ├── .envs.example/      # Example env files to copy
│   └── local.yml           # Docker Compose for local development
├── frontend/               # React 19 frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # One component per route
│   │   ├── store/          # Redux slices
│   │   ├── services/       # Axios + backend health manager
│   │   ├── context/        # React context providers
│   │   └── config/         # Typed environment config
│   ├── Dockerfile
│   └── package.json
├── terraform/              # Infrastructure as Code
│   ├── modules/            # ECS, RDS, ElastiCache, S3, CloudFront
│   └── environments/       # dev, staging, production configs
├── scripts/                # DB sync, deployment utilities
├── Makefile                # Common backend commands (from BackEndApi/)
├── docker-compose.yml      # Production multi-service compose
└── projectmaker.yml        # ProjectMaker deployment config (6 services)
```

## After Generation

1. **Navigate to your project:**
   ```bash
   cd <project_slug>
   ```

2. **Copy and configure env files:**
   ```bash
   cp -r BackEndApi/.envs.example/.local BackEndApi/.envs/.local
   vim BackEndApi/.envs/.local/.django   # Set DJANGO_SECRET_KEY, etc.
   vim BackEndApi/.envs/.local/.db       # Set database credentials
   ```

3. **Start the development stack:**
   ```bash
   cd BackEndApi
   make build
   make migrate
   make up
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/api/v1/
   - Admin: http://localhost:8000/`<ADMIN_URL>`/

## Features

### Backend (Django)
- JWT authentication with refresh tokens and automatic rotation
- Account verification flow
- WebSocket support via Django Channels + Redis channel layer
- Celery background task processing with Redis as broker
- S3 integration for file uploads
- GitHub OAuth integration
- Removable scaffold CRUD module (`items`) demonstrating ViewSet, serializer, service layer, and Celery task patterns; replace or delete it when the product domain is defined.
- pytest setup with fixtures and factories

### Frontend (React)
- React 19 with TypeScript and strict mode
- Redux Toolkit with typed hooks
- Auth flow: login → verify → dashboard
- Dark mode via ThemeContext
- Backend health polling + graceful server-starting UX
- EN/ES i18n via i18next
- Axios with automatic JWT refresh interceptors

### Infrastructure (Terraform)
- AWS ECS Fargate for containerised deployment
- RDS PostgreSQL for the database
- ElastiCache Redis for caching, sessions, and Celery
- S3 + CloudFront for static assets
- Application Load Balancer with HTTPS
- VPC with public/private subnets
- Secrets Manager for credentials

### DevOps
- Docker Compose for local development (Django, Celery worker, Celery beat, Postgres, Redis, Nginx)
- Production-ready multi-stage Dockerfiles
- Makefile with common commands
- Database sync utilities in `scripts/`

## ProjectMaker Services

The generated `projectmaker.yml` declares 6 services:

| Service | Type | Description |
|---|---|---|
| `frontend` | frontend | React app served by Nginx on port 80 |
| `backend` | backend | Django + Gunicorn on port 8000, route `/api` |
| `celery-worker` | worker | Celery worker (same image as backend) |
| `celery-beat` | worker | Celery beat scheduler |
| `postgres` | internal | PostgreSQL 15 |
| `redis` | internal | Redis 7 |

**Deployment commands:** `migrate` · `collectstatic` · `createsuperuser` · `test`

## Verification Policy (Agent + CI)

All automated agents and CI smoke runs must execute API-contract verification before E2E:

- Backend schema validation: `python manage.py spectacular --validate`
- Frontend contract/type validation: `npm run validate:api-contract`
- E2E entrypoint: `npm run test:e2e:ci` (already chains contract validation)

In this template, these checks are wired in `projectmaker.yml` under `smoke_test.steps`, and in `projectmaker.dev.yml` via the `test_contract`/`test_e2e` command flow.

## Documentation

See the `docs/` directory in your generated project for:
- `INFRASTRUCTURE.md` — AWS architecture details
- `DEPLOYMENT_QUICKSTART.md` — Step-by-step deployment guide
- `CONFIGURATION.md` — Full env var reference
- `DATABASE_PERSISTENCE.md` — Database backup and restore
- `WEBSOCKET_USAGE.md` — WebSocket implementation guide

## License

This template is available under the MIT License.
