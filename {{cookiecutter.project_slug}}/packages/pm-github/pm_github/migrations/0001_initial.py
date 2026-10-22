from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='GitHubProfile',
            fields=[
                (
                    'id',
                    models.AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name='ID',
                    ),
                ),
                (
                    'created',
                    models.DateTimeField(
                        auto_now_add=True,
                        help_text='Date time on which the object was created.',
                        verbose_name='created at',
                    ),
                ),
                (
                    'modified',
                    models.DateTimeField(
                        auto_now=True,
                        help_text='Date time on which the object was modified.',
                        verbose_name='modified at',
                    ),
                ),
                (
                    'deleted',
                    models.BooleanField(
                        default=False,
                        help_text='Set to False when an element is deleted',
                    ),
                ),
                ('github_id', models.CharField(max_length=50, unique=True)),
                ('github_username', models.CharField(max_length=100)),
                ('github_access_token', models.TextField(blank=True, null=True)),
                ('github_token_expires_at', models.DateTimeField(blank=True, null=True)),
                (
                    'user',
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='github_profile',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                'ordering': ['-created', '-modified'],
                'get_latest_by': 'created',
                'abstract': False,
            },
        ),
    ]
