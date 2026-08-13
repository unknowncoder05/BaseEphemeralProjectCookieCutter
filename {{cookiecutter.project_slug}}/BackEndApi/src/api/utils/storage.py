from django.conf import settings
from storages.backends.s3boto3 import S3Boto3Storage


class PublicMediaStorage(S3Boto3Storage):
    location = 'media'
    default_acl = 'private'
    file_overwrite = False


class PrivateMediaStorage(S3Boto3Storage):
    location = 'private-media'
    default_acl = 'private'
    file_overwrite = False
    custom_domain = None
    querystring_auth = True

    @property
    def bucket_name(self):
        return (
            getattr(settings, 'AWS_PRIVATE_STORAGE_BUCKET_NAME', None)
            or getattr(settings, 'AWS_STORAGE_BUCKET_NAME', None)
        )
