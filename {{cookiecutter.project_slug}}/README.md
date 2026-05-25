# {{ cookiecutter.project_name }}

{{ cookiecutter.description }}

Full-stack web application with a **Django REST + WebSocket backend**, a **React 19 + TypeScript frontend**, **Celery** for background tasks, **PostgreSQL**, and **Redis**.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python {{ cookiecutter.python_version }}, Django REST Framework, Django Channels, Celery |
| Frontend | React 19, TypeScript, Redux Toolkit, Tailwind CSS, React Router |
| Database | PostgreSQL 15 |
| Cache / Broker | Redis 7 |
| Container | Docker Compose (local + production) |
| Infrastructure | AWS ECS Fargate, RDS, ElastiCache, S3, CloudFront (Terraform) |

## Local Development

```bash
# 1. Copy env files and fill in values
cp -r BackEndApi/.envs.example/.local BackEndApi/.envs/.local

# 2. Build and start all services
cd BackEndApi
make build
make migrate
make up
```

Services:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api/v1/
- **Django Admin**: http://localhost:8000/`\$ADMIN_URL`/
- **Celery**: running in background (no port)

## Architecture

```
{{ cookiecutter.project_slug }}/
├── BackEndApi/          # Django backend
│   ├── src/
│   │   ├── api/
│   │   │   ├── items/  # Example CRUD module — copy this pattern for new modules
│   │   │   ├── users/  # Authentication, profiles, GitHub OAuth
│   │   │   ├── ws/     # WebSocket consumer
│   │   │   └── utils/  # Shared utilities (health check, keep-alive)
│   │   └── config/     # Django settings, URLs, Celery config
│   ├── compose/
│   │   ├── local/      # Local Docker config (Django, Celery, Nginx)
│   │   └── production/ # Production Docker config
│   └── requirements/   # base.txt · local.txt · production.txt
├── frontend/            # React frontend
│   └── src/
│       ├── components/ # Reusable UI components
│       ├── pages/      # Page components (one file per route)
│       ├── store/      # Redux slices and async thunks
│       ├── services/   # API client (Axios)
│       ├── context/    # React context providers (ThemeContext, etc.)
│       └── config/     # Environment config
├── terraform/          # Infrastructure as Code
└── projectmaker.yml    # ProjectMaker deployment config
```

## Frontend Views & Navigation Flow

### Views (Pages)
- **HomePage**: Landing page with introduction and entry points.
- **AuthPage**: Handles both Login and Signup/Registration.
- **VerifyAccount**: OTP/Email verification after signup.
- **VerifyLogin**: Second-factor or additional login verification if required.
- **Dashboard**: Central hub for authenticated users.
- **ItemsPage**: Generic CRUD interface for managing items (example module).
- **SettingsPage**: User profile and application preferences.
- **ServerStartPage**: Initial state while waiting for backend/database to be ready.
- **ServerDown**: Error view shown when the backend API is unreachable.
- **NotFoundPage**: standard 404 for invalid routes.

### Navigation Flow
1.  **Entry**: `HomePage` or `ServerStartPage` (if backend is warming up).
2.  **Authentication**: `HomePage` -> `AuthPage` (Login/Signup).
3.  **Post-Auth**: `AuthPage` -> `Dashboard`.
4.  **Feature Access**: `Dashboard` -> `ItemsPage` or `SettingsPage`.
5.  **Error States**: Any page -> `ServerDown` (API failure) or `NotFoundPage` (invalid URL).

### Redundancy Check
- `AuthPage` serves both Login and Signup to reduce boilerplate.
- `ItemsPage` is a template for all future CRUD modules; do not create separate pages for simple list/detail views if they can be handled via dynamic routing or components within `ItemsPage`.

## Backend API Mapping

### Documentation & Discovery
- **Swagger UI**: \`<API>/docs/\` (Interactive exploration)
- **ReDoc**: \`<API>/redoc/\` (Clean, three-panel documentation)
- **OpenAPI Schema**: \`<API>/schema/\` (Raw YAML/JSON)

### Design Principles
- **Redundancy Check**: Before creating a new endpoint, check if existing ViewSets can be extended with \`@action\` or if the required data is already available in a nested serializer.
- **Versioning**: All endpoints are prefixed with \`/api/v1/\`. Do not introduce breaking changes without a strategy for versioning or frontend migration.
- **Consistency**: Follow the established pattern of separating logic into \`serializers.py\`, \`views.py\`, and \`services.py\`.

## Backend API Endpoints

Base path is configured by \`DJANGO_API_URI\` env var (default \`/api/v1\`).

| Endpoint | Module | Description |
|---|---|---|
| \`GET <API>/health/\` | utils | Health check (no auth) |
| \`GET <API>/keep-alive/\` | utils | Keep-alive ping (no auth) |
| \`POST <API>/auth/login/\` | users | Obtain JWT tokens |
| \`POST <API>/auth/signup/\` | users | Register new user |
| \`POST <API>/auth/token/refresh/\` | users | Refresh access token |
| \`GET/PUT <API>/users/me/\` | users | Current user profile |
| \`GET/POST <API>/items/\` | items | List / create items |
| \`GET/PUT/PATCH/DELETE <API>/items/{id}/\` | items | Item detail |

WebSocket endpoint: \`ws://<host>/ws/\` (JWT auth on connect).

## Agent Instructions
- **Update Requirement**: Any time a new page, significant navigation change, or new API endpoint is added, update the corresponding mapping sections in this README.
- **Planning**: Before implementing new features, refer to the existing view and API maps to identify redundancies and ensure the change aligns with the established architecture.
- **Consistency**: 
    - Keep the "Frontend Views & Navigation Flow" and "Backend API Mapping" sections in sync.
    - Ensure new routes are added to the "Frontend Routes" table.
    - Ensure new endpoints are added to the "Backend API Endpoints" table.
- **Plan Mode**: Always include updating this README as a task in your execution plan when modifying the UI or API structure.

## Frontend Routes

All routes are defined in \`frontend/src/App.tsx\`.

| Route | Auth required | Component |
|---|---|---|
| \`/login\` | No | \`AuthPage\` |
| \`/signup\` | No | \`AuthPage\` |
| \`/verify\` | No | \`VerifyAccount\` |
| \`/verify-login\` | No | \`VerifyLogin\` |
| \`/dashboard\` | Yes | \`Dashboard\` |
| \`/items\` | Yes | \`ItemsPage\` |
| \`/items/:id\` | Yes | \`ItemsPage\` |
| \`/settings\` | Yes | \`SettingsPage\` |
| \`/server-down\` | No | \`ServerDown\` |
| \`/start-server\` | No | \`ServerStartPage\` |

## Adding a New Module

1. Create \`BackEndApi/src/api/<module>/\` following the \`items/\` module pattern
2. Add to \`INSTALLED_APPS\` in \`BackEndApi/src/config/settings/base.py\`
3. Add URL include in \`BackEndApi/src/config/urls.py\`
4. Add a Redux slice in \`frontend/src/store/<module>Slice.ts\`
5. Add page components in \`frontend/src/pages/\`
6. Register route in \`frontend/src/App.tsx\`

## Useful Commands

\`\`\`bash
# From BackEndApi/
make build          # Build Docker images
make up             # Start all services
make down           # Stop all services
make migrate        # Run Django migrations
make makemigrations # Create new migration files
make test           # Run pytest
make shell          # Django shell
make logs           # Tail container logs

# ProjectMaker deployment commands (from UI or CLI)
migrate             # python manage.py migrate --noinput
collectstatic       # python manage.py collectstatic --noinput
createsuperuser     # DJANGO_SUPERUSER_PASSWORD=... python manage.py createsuperuser --noinput --username ... --email ...
test                # pytest
\`\`\`

## Environment Variables

Environment variables are split into three files per environment:

\`\`\`
BackEndApi/.envs/{env}/
├── .django   # Django settings (SECRET_KEY, DEBUG, ADMIN_URL, etc.)
├── .db       # PostgreSQL credentials
└── .cloud    # AWS / S3 / external service credentials
\`\`\`

See \`projectmaker.yml\` for the full schema with labels and descriptions.

## Public vs Private S3 Uploads

This template provisions and wires two S3 buckets:

- \`AWS_STORAGE_BUCKET_NAME\`: public media bucket (for files that may be publicly accessible).
- \`AWS_PRIVATE_STORAGE_BUCKET_NAME\`: private media bucket (for sensitive files; never publicly readable).

Service resource reservations are declared per service in `projectmaker.yml` and `projectmaker.dev.yml` using:

- `cpu`: CPU cores requested by the service (e.g. `0.5`, `1`)
- `memory`: RAM in MB requested by the service (e.g. `512`, `1024`)

Backend storage classes:

- \`api.utils.storage.PublicMediaStorage\` (default for public uploads)
- \`api.utils.storage.PrivateMediaStorage\` (private bucket + signed URLs)

Use private storage explicitly on sensitive fields:

\`\`\`python
from django.db import models
from api.utils.storage import PrivateMediaStorage

class IdentityDocument(models.Model):
    file = models.FileField(upload_to='identity/%Y/%m/%d/', storage=PrivateMediaStorage())
\`\`\`

Use public storage for non-sensitive assets:

\`\`\`python
from django.db import models
from api.utils.storage import PublicMediaStorage

class Profile(models.Model):
    avatar = models.ImageField(upload_to='avatars/%Y/%m/%d/', storage=PublicMediaStorage())
\`\`\`

---

## Codebase Status

### Tech Stack
- **Backend**: Python {{ cookiecutter.python_version }}, Django REST Framework, Django Channels, Celery + Redis
- **Frontend**: React 19, TypeScript, Redux Toolkit, Tailwind CSS
- **Database**: PostgreSQL 15, Redis 7
- **Deployment**: Docker Compose, AWS ECS (Terraform)

### Implemented Features
- [x] JWT authentication (login, signup, token refresh) — \`api/users/\`
- [x] Account verification flow — \`api/users/\`
- [x] GitHub OAuth integration — \`api/users/\`
- [x] WebSocket consumer with JWT auth — \`api/ws/consumers.py\`
- [x] Background task processing (Celery + Redis) — \`api/items/tasks.py\`
- [x] Example CRUD module (\`items\`) with ViewSet, serializers, service layer, tests — \`api/items/\`
- [x] S3 file upload integration — \`api/utils/\`
- [x] Health check + keep-alive endpoints — \`api/utils/views.py\`
- [x] React auth flow (login/signup/verify) — \`frontend/src/pages/AuthPage.tsx\`
- [x] Redux auth state with JWT persistence — \`frontend/src/store/authSlice.ts\`
- [x] Dark mode toggle (ThemeContext) — \`frontend/src/context/ThemeContext.tsx\`
- [x] Backend health polling + server start page — \`frontend/src/services/BackendManager.ts\`
- [x] Items CRUD UI — \`frontend/src/pages/ItemsPage.tsx\`
- [x] User settings page — \`frontend/src/pages/SettingsPage.tsx\`
- [x] i18n support (EN/ES) — \`frontend/src/i18n/\`

### Architecture Notes
- New Django modules go in \`BackEndApi/src/api/<module>/\` — copy the \`items/\` module pattern
- New frontend pages go in \`frontend/src/pages/\` with a matching route in \`App.tsx\`
- All business logic belongs in \`services.py\` (backend) or Redux thunks (frontend) — keep views thin
- WebSocket messages use \`channel_layer.group_send\` from Celery tasks; consumer is in \`api/ws/\`

### API Endpoints
- See "Backend API Endpoints" table above

### Data Models
- \`User\` — extended Django user with profile fields (\`api/users/models.py\`)
- \`Item\` — example CRUD model with status and archive fields (\`api/items/models.py\`)

### Known Issues / TODOs
- (none — add items here as you work on the project)

## Agent Verification Requirements

When an agent runs testing or smoke validation for this template, run these checks in order:

1. Backend schema validation: `python manage.py spectacular --validate`
2. Frontend API contract and type validation: `npm run validate:api-contract`
3. End-to-end tests: `npm run test:e2e:ci`

These checks are wired into `projectmaker.yml` `smoke_test.steps` and `projectmaker.dev.yml` (`test_contract` and `test_e2e` commands), and should not be skipped.
