# Django
from django.urls import include, path
from rest_framework_nested.routers import SimpleRouter, NestedSimpleRouter

# Views
from api.users.views import *
from api.users.views.bank import BankAccountTypeViewSet, BankViewSet
from api.users.views.bank_information import BankInformationViewSet
from api.users.views.document_type import DocumentTypeViewSet
# Django Rest Framework
from api.users.views.identiy_files import IdentityFilesViewSet

router = SimpleRouter()

router.register(r'users', UsersViewSet, basename='users')
router.register(r'auth', AuthViewSet, basename='auth')
router.register(r'auth', PasswordResetViewSet, basename='auth-password')
# PM_GITHUB_START
if GitHubOAuthViewSet is not None:
    router.register(r'github', GitHubOAuthViewSet, basename='github')
# PM_GITHUB_END
router.register(r'documents_types', DocumentTypeViewSet, basename='documents_types')
router.register(r'bank', BankViewSet, basename='bank')
router.register(r'bank_account_type', BankAccountTypeViewSet, basename='account_type')

nested_router = NestedSimpleRouter(router, 'users', lookup='users')
nested_router.register('identity_files', IdentityFilesViewSet, basename='identity_files')
nested_router.register('bank_information', BankInformationViewSet, basename='bank_information')

urlpatterns = [
    path('', include(router.urls + nested_router.urls)),
    # path('password-reset/<uidb64>/<token>/', auth_view.PasswordResetConfirmView.as_view(),name='password-reset'),
    # path('password_reset_complete/',auth_view.PasswordResetCompleteView.as_view(),name='password-reset-complete'),

    path('auth/token/', CustomTokenObtainPairView.as_view(), name='login'),
    path('auth/token-refresh/', CustomTokenRefreshView.as_view(), name='refresh'),
]
