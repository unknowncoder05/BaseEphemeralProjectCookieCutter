from __future__ import annotations

import ast
import re

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
