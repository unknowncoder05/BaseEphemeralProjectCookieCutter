"""Base settings to build other settings files upon."""
import importlib.util
import os
from datetime import timedelta

import environ

APP_NAME = '{{ cookiecutter.project_name }}'

API_URI = 'api/v1'

ROOT_DIR = environ.Path(__file__) - 3
APPS_DIR = ROOT_DIR.path('api')

env = environ.Env()

# Base
ENVIRONMENT = env('ENVIRONMENT', default='production')
DEBUG = env.bool('DJANGO_DEBUG', False)

# Language and timezone
TIME_ZONE = '{{ cookiecutter.timezone }}'
SITE_ID = 1
USE_I18N = True
USE_L10N = False
USE_TZ = True

# DATABASES
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('POSTGRES_DB'),
        'USER': os.environ.get('POSTGRES_USER'),
        'PASSWORD': os.environ.get('POSTGRES_PASSWORD'),
        'HOST': os.environ.get('POSTGRES_HOST'),
        'PORT': os.environ.get('POSTGRES_PORT', '5432'),
        'OPTIONS': {
            'connect_timeout': 30,
        }
    }
}
DATABASES['default']['ATOMIC_REQUESTS'] = False

# URLs
ROOT_URLCONF = 'config.urls'

# WSGI
WSGI_APPLICATION = 'config.wsgi.application'

# ASGI
ASGI_APPLICATION = 'config.asgi.application'

# Users & Authentication
AUTH_USER_MODEL = 'users.User'

# Apps
DJANGO_APPS = [
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.admin',
]

THIRD_PARTY_APPS = [
    'modeltranslation',
    'channels',
    'rest_framework',
    'drf_spectacular',
    'rest_framework.authtoken',
    'rest_framework_simplejwt',
    'corsheaders',
    'djmoney',
    'djmoney.contrib.exchange',
    'pm_auth',
    'pm_utils',
    'pm_billing',
    'pm_ai',

    "admin_interface",
    "colorfield",
    "django_celery_beat",
]

if importlib.util.find_spec('pm_sqlite_snapshots') is not None:
    THIRD_PARTY_APPS.append('pm_sqlite_snapshots.apps.SQLiteSnapshotsConfig')

if importlib.util.find_spec('pm_github') is not None:
    THIRD_PARTY_APPS.append('pm_github')

LOCAL_APPS = [
    'api.users.apps.UsersAppConfig',
    'api.items.apps.ItemsConfig',
    'api.ai.apps.AIConfig',
    'api.ws.apps.WebSocketConfig',
]

INSTALLED_APPS = THIRD_PARTY_APPS + DJANGO_APPS + LOCAL_APPS

EXCHANGE_BACKEND = 'djmoney.contrib.exchange.backends.FixerBackend'

# only if django version >= 3.0
X_FRAME_OPTIONS = "SAMEORIGIN"
SILENCED_SYSTEM_CHECKS = ["security.W019"]

# Passwords
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.Argon2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
    'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',
    'django.contrib.auth.hashers.BCryptPasswordHasher',
]

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 8,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },

]

# Middlewares
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.locale.LocaleMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'corsheaders.middleware.CorsMiddleware'
]

# Static files
STATIC_ROOT = str(ROOT_DIR('staticfiles'))
STATIC_URL = '/staticfiles/'
STATICFILES_DIRS = [
    str(APPS_DIR.path('staticfiles')),
]
STATICFILES_FINDERS = [
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
]

# Media
MEDIA_ROOT = str(ROOT_DIR('media'))
MEDIA_URL = '/media/'

# Templates
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            str(APPS_DIR.path('templates')),
        ],
        'OPTIONS': {
            'debug': DEBUG,
            'loaders': [
                'django.template.loaders.filesystem.Loader',
                'django.template.loaders.app_directories.Loader',
            ],
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.template.context_processors.i18n',
                'django.template.context_processors.media',
                'django.template.context_processors.static',
                'django.template.context_processors.tz',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# Security
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True
SECURE_BROWSER_XSS_FILTER = True

# Email
EMAIL_BACKEND = env('DJANGO_EMAIL_BACKEND', default='django.core.mail.backends.console.EmailBackend')

# Admin
ADMIN_URL = 'admin/'

# Django REST Framework
REST_FRAMEWORK = {
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
    ),
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "pm_auth.api.users.auth.authentication.CookieOrHeaderAuthentication",
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.LimitOffsetPagination',
    'PAGE_SIZE': 12,
    'EXCEPTION_HANDLER': 'pm_utils.api.utils.exceptions.custom_exception_handler',
}

# AUTOFIELD
DEFAULT_AUTO_FIELD = 'django.db.models.AutoField'

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

MAIN_DATE_FORMAT = "%Y-%m-%d"
MAIN_DATETIME_FORMAT = "%Y-%m-%d %H:%M:%S"


# CMS


def gettext(s): return s


LANGUAGES = (
    ('es', gettext('Spanish')),
    ('en', gettext('English')),
)

# MODELTRANSLATION_TRANSLATION_FILES = (
#    'cms.translation',
# )
MODELTRANSLATION_AUTO_POPULATE = True

# Authentication

SIMPLE_JWT = {
    # Cookie name. Enables cookies if value is set.
    'ACCESS_TOKEN_COOKIE': 'ACCESS',
    # Whether the auth cookies should be secure (https:// only).
    'ACCESS_TOKEN_COOKIE_SECURE': False,
    # Http only cookie flag.It's not fetch by javascript.
    'ACCESS_TOKEN_COOKIE_HTTP_ONLY': True,
    # Whether to set the flag restricting cookie leaks on cross-site requests.
    'ACCESS_TOKEN_COOKIE_SAMESITE': 'Lax',
    # Cookie name. Enables cookies if value is set.
    'REFRESH_TOKEN_COOKIE': 'REFRESH',
    # Whether the auth cookies should be secure (https:// only).
    'REFRESH_TOKEN_COOKIE_SECURE': False,
    # Http only cookie flag.It's not fetch by javascript.
    'REFRESH_TOKEN_COOKIE_HTTP_ONLY': True,
    # Whether to set the flag restricting cookie leaks on cross-site requests.
    'REFRESH_TOKEN_COOKIE_SAMESITE': 'Lax',
}

AUTHENTICATION_EXTERNAL_TOKEN_EXPIRY = timedelta(hours=5)
AUTHENTICATION_EXTERNAL_TOKEN_PROVIDERS = ['console', 'sms', 'whatsapp']
AUTHENTICATION_EXTERNAL_TOKEN_FORMAT_DEFAULT = os.getenv(
    'AUTHENTICATION_EXTERNAL_TOKEN_FORMAT_CONSOLE', 'This is your token for {app_name}: {token}')
AUTHENTICATION_EXTERNAL_TOKEN_FORMATS = {
    provider: {
        'sign_in': os.getenv(f'AUTHENTICATION_EXTERNAL_TOKEN_FORMAT_{provider.upper()}_SIGN_IN',
                             AUTHENTICATION_EXTERNAL_TOKEN_FORMAT_DEFAULT),
        'validate_account': os.getenv(f'AUTHENTICATION_EXTERNAL_TOKEN_FORMAT_{provider.upper()}_VALIDATE_ACCOUNT',
                                      AUTHENTICATION_EXTERNAL_TOKEN_FORMAT_DEFAULT),
        'reset_password': os.getenv(f'AUTHENTICATION_EXTERNAL_TOKEN_FORMAT_{provider.upper()}_RESET_PASSWORD',
                                    AUTHENTICATION_EXTERNAL_TOKEN_FORMAT_DEFAULT),
        'recover_account': os.getenv(f'AUTHENTICATION_EXTERNAL_TOKEN_FORMAT_{provider.upper()}_RECOVER_ACCOUNT',
                                     AUTHENTICATION_EXTERNAL_TOKEN_FORMAT_DEFAULT),
    } for provider in AUTHENTICATION_EXTERNAL_TOKEN_PROVIDERS
}

AWS_REGION_NAME = os.getenv('AWS_REGION_NAME', default='{{ cookiecutter.aws_region }}')

WHATSAPP_AUTHORIZATION_TYPE = os.getenv(
    'WHATSAPP_AUTHORIZATION_TYPE', 'Bearer')
WHATSAPP_AUTHORIZATION_TOKEN = os.getenv('WHATSAPP_AUTHORIZATION_TOKEN')
WHATSAPP_MESSAGE_URI = os.getenv('WHATSAPP_MESSAGE_URI')

LOCALE_PATHS = [
    ROOT_DIR('locales')
]

MODELTRANSLATION_DEFAULT_LANGUAGE = 'es'

MODELTRANSLATION_FALLBACK_LANGUAGES = ('es', 'en')
LANGUAGE_CODE = 'es-CO'


# MAX SIZE FIELD
MAX_IMAGE_SIZE = env.int('MAX_IMAGE_SIZE', default=1024)

# Optional: AI Integration
# Set use_ai_integration to 'y' in cookiecutter to include these
# OpenAI
OPENAI_API_KEY = env('OPENAI_API_KEY', default=None)
OPENAI_MODEL = env('OPENAI_MODEL', default='gpt-4o-mini')
OPENAI_TEMPERATURE = env.float('OPENAI_TEMPERATURE', default=0.7)
OPENAI_MAX_TOKENS = env.int('OPENAI_MAX_TOKENS', default=20000)

# Anthropic Claude
ANTHROPIC_API_KEY = env('ANTHROPIC_API_KEY', default=None)
ANTHROPIC_MODEL = env('ANTHROPIC_MODEL', default='claude-sonnet-4-5-20250929')
ANTHROPIC_MAX_TOKENS = env.int('ANTHROPIC_MAX_TOKENS', default=8000)

# Billing
STRIPE_SECRET_KEY = env('STRIPE_SECRET_KEY', default='')
STRIPE_WEBHOOK_SECRET = env('STRIPE_WEBHOOK_SECRET', default='')
STRIPE_SUCCESS_URL = env('STRIPE_SUCCESS_URL', default='http://localhost:3000/settings/billing?session_id={CHECKOUT_SESSION_ID}')
STRIPE_CANCEL_URL = env('STRIPE_CANCEL_URL', default='http://localhost:3000/settings/billing?cancelled=true')
CREDIT_MINIMUM_BALANCE = env('CREDIT_MINIMUM_BALANCE', default='0.00')
CREDIT_COST_MARKUP = env('CREDIT_COST_MARKUP', default='1.0')

# Password Reset
PASSWORD_RESET_METHOD = env('PASSWORD_RESET_METHOD', default='email')
PASSWORD_RESET_FRONTEND_URL = env('PASSWORD_RESET_FRONTEND_URL', default='http://localhost:3000/reset-password')
ACCOUNT_RECOVERY_FRONTEND_URL = env('ACCOUNT_RECOVERY_FRONTEND_URL', default='http://localhost:3000/recover-account')

# GitHub OAuth
GITHUB_CLIENT_ID = env('GITHUB_CLIENT_ID', default=None)
GITHUB_CLIENT_SECRET = env('GITHUB_CLIENT_SECRET', default=None)
GITHUB_REDIRECT_URI = env('GITHUB_REDIRECT_URI', default='http://localhost:3000/settings/github/callback')
GITHUB_OAUTH_SCOPES = env.list('GITHUB_OAUTH_SCOPES', default=['repo', 'read:user', 'user:email'])

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose'
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.request': {
            'handlers': ['console'],
            'level': 'ERROR',
            'propagate': False,
        },
        'api': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
}

# SPECTACULAR SETTINGS
SPECTACULAR_SETTINGS = {
    'TITLE': '{{ cookiecutter.project_name }} API',
    'DESCRIPTION': '{{ cookiecutter.description }}',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_PATCH': True,
    'COMPONENT_SPLIT_REQUEST': True,
    'SWAGGER_UI_SETTINGS': {
        'deepLinking': True,
        'persistAuthorization': True,
        'displayOperationId': True,
    },
}
