# Development image — source is bind-mounted at /project, not baked in.
# Each Compose project gets its own /venv volume, seeded from this image.
# Dependency layers are cached across disposable verification namespaces.

FROM python:3.12-alpine

ENV PYTHONUNBUFFERED=1
# Virtualenv at /venv so it can live in a named volume separate from the image layers
ENV VIRTUAL_ENV=/venv
ENV PATH="/venv/bin:$PATH"
# Source is mounted at /project/BackEndApi/src by docker-compose.dev.yml
ENV PYTHONPATH=/project/BackEndApi/src

# System-level runtime dependencies (same set as production for compatibility)
RUN apk update && apk add --no-cache \
    bash git curl \
    gcc g++ python3-dev musl-dev \
    postgresql-dev postgresql-client \
    libffi-dev py-cffi cargo \
    jpeg-dev zlib-dev freetype-dev lcms2-dev openjpeg-dev tiff-dev \
    gettext

# Install once during image preparation. Docker copies this initialized venv
# into each new project's volume; database/data volumes remain independent.
COPY BackEndApi/requirements /project/BackEndApi/requirements
COPY packages /project/packages
COPY BackEndApi/compose/dev/django/entrypoint.sh /entrypoint.sh
ARG REQUIREMENTS_FILE=local.txt
RUN python -m venv /venv && chmod +x /entrypoint.sh \
    && REQUIREMENTS_FILE="${REQUIREMENTS_FILE}" /entrypoint.sh true

# Copy startup scripts — these are small helpers, never the source code itself
COPY BackEndApi/compose/dev/django/start                /start
COPY BackEndApi/compose/dev/django/celery/worker/start  /start-celeryworker
COPY BackEndApi/compose/dev/django/celery/beat/start    /start-celerybeat
COPY BackEndApi/compose/common/django/wait-for-schema   /wait-for-schema
COPY BackEndApi/compose/production/django/wait_for_postgres.py /wait_for_postgres.py

RUN chmod +x /entrypoint.sh /start /start-celeryworker /start-celerybeat /wait-for-schema

# Source will be overlaid by the bind mount at runtime
WORKDIR /project/BackEndApi/src

ENTRYPOINT ["/entrypoint.sh"]
CMD ["/start"]
