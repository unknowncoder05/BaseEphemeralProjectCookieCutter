from __future__ import annotations

import ast
import re
from pathlib import Path

from .migration_ast import DROP_SQL_RE, constant_bool, keyword_value, operation_name
from .models import Finding


DESTRUCTIVE = {"DeleteModel", "RemoveField", "RenameField", "RenameModel"}
SCHEMA_OPERATIONS = {
    "AddConstraint", "AddField", "AddIndex", "AlterField",
    "AlterIndexTogether", "AlterModelTable", "AlterModelTableComment",
    "AlterOrderWithRespectTo", "AlterUniqueTogether", "CreateModel",
    "DeleteModel", "RemoveConstraint", "RemoveField", "RemoveIndex",
    "RenameField", "RenameIndex", "RenameModel",
}
RUNTIME_LAUNCH_FILES = {
    "apps.py", "asgi.py", "celery.py", "entrypoint", "entrypoint.py",
    "entrypoint.sh", "start", "start.py", "start.sh", "startup.py",
    "startup.sh", "wsgi.py",
}
UNLOCKED_MIGRATE_RE = re.compile(
    r"(?:\bmanage\.py|\bdjango-admin|\bpython(?:3(?:\.\d+)?)?\s+-m\s+django)"
    r"\s+migrate(?![\w-])",
    re.IGNORECASE,
)
PROGRAMMATIC_MIGRATE_RE = re.compile(
    r"\b(?:call_command\s*\(\s*['\"]migrate['\"]|MigrationExecutor\s*\()"
)
STARTUP_DDL_RE = re.compile(
    r"\b(?:alter\s+table|create\s+(?:unique\s+)?index|create\s+table|"
    r"drop\s+(?:table|index))\b",
    re.IGNORECASE,
)


def _is_runtime_launch_path(path: str) -> bool:
    normalized = path.replace("\\", "/").lower()
    name = normalized.rsplit("/", 1)[-1]
    return (
        name in RUNTIME_LAUNCH_FILES
        or (
            "/compose/" in f"/{normalized}"
            and re.fullmatch(r"(?:docker-)?entrypoint(?:[._-].*)?|start(?:[._-].*)?", name)
            is not None
        )
        or name.startswith("dockerfile")
        or name in {"local.yml", "local.yaml", "prod.yml", "prod.yaml", "production.yml", "production.yaml"}
        or re.fullmatch(r"(?:docker-)?compose(?:\.[^.]+)*\.ya?ml", name) is not None
        or re.fullmatch(r"projectmaker(?:\.[^.]+)*\.ya?ml", name) is not None
    )


def _without_comment_lines(text: str) -> str:
    return "\n".join(
        line for line in text.splitlines()
        if not line.lstrip().startswith("#")
    )


def check_django_startup(root: Path, paths: list[str]) -> list[Finding]:
    """Reject schema work that can be inherited by concurrent service startup."""
    findings: list[Finding] = []
    for path in paths:
        if not _is_runtime_launch_path(path):
            continue
        absolute = root / path
        if not absolute.is_file():
            continue
        try:
            text = _without_comment_lines(absolute.read_text(encoding="utf-8"))
        except (OSError, UnicodeDecodeError):
            continue

        if UNLOCKED_MIGRATE_RE.search(text) or PROGRAMMATIC_MIGRATE_RE.search(text):
            findings.append(Finding(
                "error", "django.startup-schema-owner", path,
                "runtime schema setup is not database-serialized and can race when web, worker, "
                "beat, or replacement containers start together; route it through one "
                "PostgreSQL advisory-lock command such as "
                "`python manage.py migrate_with_db_lock --noinput`, and never call Django's "
                "plain migrate command from a shared entrypoint",
            ))
        if STARTUP_DDL_RE.search(text):
            findings.append(Finding(
                "error", "django.startup-schema-ddl", path,
                "raw schema DDL in a runtime launch path can deadlock or partially apply during "
                "concurrent container startup; move the DDL into a Django migration and run "
                "startup migrations through the database-serialized migration command",
            ))
    return findings


def _is_non_atomic_migration(tree: ast.Module) -> bool:
    for node in tree.body:
        if not isinstance(node, ast.ClassDef) or node.name != "Migration":
            continue
        for statement in node.body:
            if not isinstance(statement, (ast.Assign, ast.AnnAssign)):
                continue
            targets = statement.targets if isinstance(statement, ast.Assign) else [statement.target]
            if any(isinstance(target, ast.Name) and target.id == "atomic" for target in targets):
                return constant_bool(statement.value, True) is False
    return False


def check_django(path: str, text: str) -> list[Finding]:
    if not re.search(r"(?:^|/)migrations/\d[^/]*\.py$", path):
        return []
    try:
        tree = ast.parse(text, filename=path)
    except SyntaxError as exc:
        return [Finding("error", "migration.syntax", path, f"cannot parse migration: {exc}")]

    findings: list[Finding] = []
    if _is_non_atomic_migration(tree) and any(
        isinstance(node, ast.Call) and operation_name(node) in SCHEMA_OPERATIONS
        for node in ast.walk(tree)
    ):
        findings.append(Finding(
            "error", "migration.non-atomic-schema", path,
            "atomic=False with Django schema operations can leave committed partial DDL after "
            "a crash; split schema changes into atomic migrations and keep only explicitly "
            "idempotent operations in the non-atomic migration",
        ))
    for node in ast.walk(tree):
        if not isinstance(node, ast.Call):
            continue
        name = operation_name(node)
        if name in DESTRUCTIVE:
            findings.append(Finding(
                "error", "migration.expand-contract", path,
                f"{name} is backward-incompatible; use an expand/contract rollout or an exception",
            ))
        elif name == "RunSQL":
            sql_node = node.args[0] if node.args else keyword_value(node, "sql")
            sql = sql_node.value if isinstance(sql_node, ast.Constant) and isinstance(sql_node.value, str) else ""
            if sql and DROP_SQL_RE.search(sql):
                findings.append(Finding(
                    "error", "migration.destructive-sql", path,
                    "RunSQL contains destructive DDL; use a staged rollout or an exception",
                ))
            if keyword_value(node, "reverse_sql") is None and len(node.args) < 2:
                findings.append(Finding("warning", "migration.reversible-sql", path, "RunSQL has no reverse_sql"))
        elif name == "RunPython":
            if keyword_value(node, "reverse_code") is None and len(node.args) < 2:
                findings.append(Finding("warning", "migration.reversible-python", path, "RunPython has no reverse_code"))
        elif name == "AddField":
            field = keyword_value(node, "field")
            if isinstance(field, ast.Call):
                non_null = not constant_bool(keyword_value(field, "null"), False)
                no_default = keyword_value(field, "default") is None
                if non_null and no_default and operation_name(field) != "ManyToManyField":
                    findings.append(Finding(
                        "warning", "migration.not-null-add", path,
                        "non-null field without a migration default can lock or fail on populated tables",
                    ))
        elif name == "AlterField":
            field = keyword_value(node, "field")
            if isinstance(field, ast.Call) and constant_bool(keyword_value(field, "unique"), False):
                findings.append(Finding(
                    "warning", "migration.unique", path,
                    "adding a unique constraint may lock a populated table",
                ))
    return findings
