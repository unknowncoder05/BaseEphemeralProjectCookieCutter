from __future__ import annotations

import ast
import re


DROP_SQL_RE = re.compile(
    r"\b(drop\s+(?:column|table|index|constraint)|truncate\s+table|alter\s+table\b[^;]*\bdrop\b)",
    re.IGNORECASE | re.DOTALL,
)


def operation_name(call: ast.Call) -> str:
    if isinstance(call.func, ast.Attribute):
        return call.func.attr
    if isinstance(call.func, ast.Name):
        return call.func.id
    return ""


def keyword_value(call: ast.Call, name: str):
    for keyword in call.keywords:
        if keyword.arg == name:
            return keyword.value
    return None


def constant_bool(node, default=None):
    if isinstance(node, ast.Constant) and isinstance(node.value, bool):
        return node.value
    return default
