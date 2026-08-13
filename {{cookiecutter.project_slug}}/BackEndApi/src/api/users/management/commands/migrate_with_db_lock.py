import zlib

from django.core.management import BaseCommand, call_command
from django.db import DEFAULT_DB_ALIAS, connections


class Command(BaseCommand):
    help = "Run Django migrations behind a PostgreSQL advisory lock."

    def add_arguments(self, parser):
        parser.add_argument(
            "--noinput",
            "--no-input",
            action="store_false",
            dest="interactive",
            default=True,
            help="Tells Django to NOT prompt the user for input of any kind.",
        )
        parser.add_argument("--database", default=DEFAULT_DB_ALIAS)

    def handle(self, *args, **options):
        database = options["database"]
        connection = connections[database]
        engine = connection.settings_dict.get("ENGINE", "")

        if "postgresql" not in engine:
            call_command(
                "migrate",
                database=database,
                interactive=options["interactive"],
                verbosity=options["verbosity"],
            )
            return

        db_name = connection.settings_dict.get("NAME") or database
        lock_id = zlib.crc32(f"{db_name}:django-migrate".encode("utf-8"))

        self.stdout.write("[migrate] Waiting for database migration lock...")
        with connection.cursor() as cursor:
            cursor.execute("SELECT pg_advisory_lock(%s)", [lock_id])
        try:
            call_command(
                "migrate",
                database=database,
                interactive=options["interactive"],
                verbosity=options["verbosity"],
            )
        finally:
            with connection.cursor() as cursor:
                cursor.execute("SELECT pg_advisory_unlock(%s)", [lock_id])
