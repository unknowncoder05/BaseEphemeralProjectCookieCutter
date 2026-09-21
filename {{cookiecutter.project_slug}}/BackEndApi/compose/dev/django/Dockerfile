# Development image — source is bind-mounted at /project, not baked in.
# Python packages live in /venv (named volume) and are reinstalled only when
# requirements change.  Nothing is hardcoded; all config flows in via env vars.

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

# Pre-create virtualenv with psycopg2-binary so wait_for_postgres.py always works,
# even on first boot before requirements are installed by the entrypoint.
RUN python -m venv /venv && /venv/bin/pip install --no-cache-dir psycopg2-binary

# Copy startup scripts — these are small helpers, never the source code itself
COPY compose/dev/django/entrypoint.sh        /entrypoint.sh
COPY compose/dev/django/start                /start
COPY compose/dev/django/celery/worker/start  /start-celeryworker
COPY compose/dev/django/celery/beat/start    /start-celerybeat
COPY compose/common/django/wait-for-schema   /wait-for-schema
COPY compose/production/django/wait_for_postgres.py /wait_for_postgres.py

RUN chmod +x /entrypoint.sh /start /start-celeryworker /start-celerybeat /wait-for-schema

# Source will be overlaid by the bind mount at runtime
WORKDIR /project/BackEndApi/src

ENTRYPOINT ["/entrypoint.sh"]
CMD ["/start"]
