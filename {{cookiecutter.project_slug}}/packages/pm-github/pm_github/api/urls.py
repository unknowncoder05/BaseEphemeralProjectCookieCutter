from rest_framework.routers import DefaultRouter
from .views import GitHubOAuthViewSet

router = DefaultRouter()
router.register(r'', GitHubOAuthViewSet, basename='github-oauth')

urlpatterns = router.urls
