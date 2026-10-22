from django.db import models
from django.conf import settings
from pm_utils.api.utils.models import BaseModel


class GitHubProfile(BaseModel):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='github_profile'
    )
    github_id = models.CharField(max_length=50, unique=True)
    github_username = models.CharField(max_length=100)
    github_access_token = models.TextField(null=True, blank=True)
    github_token_expires_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.github_username} ({self.user.email})"
