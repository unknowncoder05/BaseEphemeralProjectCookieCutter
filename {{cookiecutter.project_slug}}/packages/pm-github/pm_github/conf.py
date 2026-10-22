"""GitHub app settings."""
from django.conf import settings


class GitHubSettings:
    @property
    def github_client_id(self):
        return getattr(settings, 'GITHUB_CLIENT_ID', None)

    @property
    def github_client_secret(self):
        return getattr(settings, 'GITHUB_CLIENT_SECRET', None)

    @property
    def github_redirect_uri(self):
        return getattr(settings, 'GITHUB_REDIRECT_URI', 'http://localhost:3000/settings/github/callback')

    @property
    def github_oauth_scopes(self):
        return getattr(settings, 'GITHUB_OAUTH_SCOPES', ['repo', 'read:user', 'user:email'])


github_settings = GitHubSettings()
