"""Main URLs module."""

import importlib.util

# Django
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path, re_path


# API Documentation
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
# Views
from api.utils.views import health_check, keep_alive

urlpatterns = [
    # Django Admin
    path(settings.ADMIN_URL, admin.site.urls),

    # Health check endpoint (no auth required)
    re_path(settings.API_URI + '/health/', health_check, name='health-check'),

    # Keep-alive endpoint (no auth required)
    re_path(settings.API_URI + '/keep-alive/', keep_alive, name='keep-alive'),


    # API Documentation
    re_path(settings.API_URI + '/schema/', SpectacularAPIView.as_view(), name='schema'),
    re_path(settings.API_URI + '/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    re_path(settings.API_URI + '/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    # API routes
    re_path(settings.API_URI + '/', include('api.users.urls')),
    re_path(settings.API_URI + '/', include('api.items.urls')),
    re_path(settings.API_URI + '/', include('pm_billing.api.billing.urls')),

]

if importlib.util.find_spec('pm_github') is not None:
    urlpatterns.append(re_path(settings.API_URI + '/github/', include('pm_github.api.urls')))

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
