from django.db import models
from pm_auth.api.users.abstract_models import AbstractPMUser
from pm_utils.api.utils.models import BaseModel


class DocumentType(BaseModel):
    name = models.CharField(max_length=200)
    is_active = models.BooleanField(default=True)


class User(AbstractPMUser):
    """
    User model for the local project.
    Inherits core fields from AbstractPMUser.
    """
    document_type = models.ForeignKey(DocumentType, on_delete=models.SET_NULL, null=True, blank=True)
    github_id = models.CharField(max_length=50, null=True, blank=True, unique=True)
    github_username = models.CharField(max_length=100, null=True, blank=True)
    github_access_token = models.TextField(null=True, blank=True)
    github_token_expires_at = models.DateTimeField(null=True, blank=True)

    class Meta(AbstractPMUser.Meta):
        swappable = 'AUTH_USER_MODEL'


class IdentityFiles(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    file = models.FileField()

    def __str__(self):
        return self.user.phone_number


class BankAccountType(BaseModel):
    name = models.CharField(max_length=100)


class Bank(BaseModel):
    name = models.CharField(max_length=100)


class BankInformation(BaseModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    bank = models.ForeignKey(Bank, on_delete=models.CASCADE, null=True)
    account_type = models.ForeignKey(BankAccountType, on_delete=models.CASCADE, null=True)
    account = models.CharField(max_length=100)
    file = models.FileField()
