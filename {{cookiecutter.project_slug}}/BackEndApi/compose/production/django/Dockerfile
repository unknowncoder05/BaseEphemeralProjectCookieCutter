FROM python:3.12-alpine

ENV PYTHONUNBUFFERED=1

RUN apk update \
  # psycopg2 dependencies
  && apk add --virtual build-deps gcc python3-dev musl-dev libxslt-dev \
  && apk add postgresql-dev \
  && apk add postgresql-client \
  # CFFI dependencies
  && apk add libffi-dev py-cffi \
  # Translations dependencies
  && apk add gettext \
  # Pillow dependencies
  && apk add jpeg-dev zlib-dev freetype-dev lcms2-dev openjpeg-dev tiff-dev tk-dev tcl-dev \
  # AWS CLI dependencies
  && apk add aws-cli bash curl \
  # Git for repository operations
  && apk add git

# Requirements are installed here to ensure they will be cached.
RUN apk add python3-dev

COPY ./requirements /requirements
RUN pip install -r /requirements/production.txt

# Copy scripts
COPY ./compose/production/django/start /start
RUN sed -i 's/\r//' /start
RUN chmod +x /start

COPY ./compose/production/django/celery/worker/start /start-celeryworker
RUN sed -i 's/\r$//g' /start-celeryworker
RUN chmod +x /start-celeryworker

COPY ./compose/production/django/celery/beat/start /start-celerybeat
RUN sed -i 's/\r$//g' /start-celerybeat
RUN chmod +x /start-celerybeat

COPY ./compose/production/django/wait_for_postgres.py /wait_for_postgres.py
COPY ./compose/common/django/wait-for-schema /wait-for-schema
RUN sed -i 's/\r$//g' /wait-for-schema
RUN chmod +x /wait-for-schema

COPY ./compose/production/django/db-sync.sh /db-sync.sh
RUN sed -i 's/\r//' /db-sync.sh
RUN chmod +x /db-sync.sh

COPY ./compose/production/django/entrypoint.sh /entrypoint.sh
RUN sed -i 's/\r//' /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Copy the entire src directory (contains api/, config/, manage.py, etc.)
COPY ./src /app

WORKDIR /app
RUN mkdir -p ./staticfiles ./api/staticfiles

# Add health check endpoint support
HEALTHCHECK --interval=30s --timeout=5s --start-period=120s --retries=3 \
  CMD curl -f http://localhost:8000/api/v1/health/ || exit 1

ENTRYPOINT ["/entrypoint.sh"]
