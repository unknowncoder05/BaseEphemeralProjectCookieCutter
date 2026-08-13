from __future__ import annotations

import json
import re
from pathlib import Path

from .git_scope import run_git
from .models import Finding


def _flatten_json_keys(value, prefix: str = "") -> set[str]:
    if not isinstance(value, dict):
        return {prefix} if prefix else set()
    keys: set[str] = set()
    for key, child in value.items():
        next_prefix = f"{prefix}.{key}" if prefix else str(key)
        if isinstance(child, dict):
            keys.update(_flatten_json_keys(child, next_prefix))
        else:
            keys.add(next_prefix)
    return keys


def check_translation_parity(root: Path, config: dict, selected: set[str]) -> list[Finding]:
    findings: list[Finding] = []
    primary_locale = str(config.get("primary_locale") or "en")
    locale_dirs: set[Path] = set()
    for relative_path in run_git(root, "ls-files", "-z").split("\0"):
        path = root / relative_path
        if path.name == f"{primary_locale}.json" and path.parent.name.lower() in {"locales", "locale", "i18n"}:
            locale_dirs.add(path.parent)

    for directory in sorted(locale_dirs):
        relative_dir = directory.relative_to(root).as_posix()
        if selected and not any(
            item.startswith(f"{relative_dir}/") or item.endswith((".js", ".jsx", ".ts", ".tsx"))
            for item in selected
        ):
            continue
        try:
            primary_keys = _flatten_json_keys(json.loads(
                (directory / f"{primary_locale}.json").read_text(encoding="utf-8")
            ))
        except (OSError, json.JSONDecodeError):
            continue
        for locale_path in sorted(directory.glob("*.json")):
            if locale_path.name == f"{primary_locale}.json":
                continue
            try:
                locale_keys = _flatten_json_keys(json.loads(locale_path.read_text(encoding="utf-8")))
            except (OSError, json.JSONDecodeError):
                continue
            missing = sorted(primary_keys - locale_keys)
            if missing:
                display = ", ".join(missing[:8])
                suffix = f" (+{len(missing) - 8} more)" if len(missing) > 8 else ""
                findings.append(Finding(
                    "error", "i18n.missing-keys", locale_path.relative_to(root).as_posix(),
                    f"missing translations: {display}{suffix}",
                ))
    return findings


def repository_uses_dark_mode(root: Path) -> bool:
    candidates = list(root.glob("**/tailwind.config.*")) + list(root.glob("**/*ThemeContext*"))
    for path in candidates[:40]:
        if path.is_file():
            try:
                text = path.read_text(encoding="utf-8", errors="ignore")
            except OSError:
                continue
            if "darkMode" in text or "dark" in text.lower():
                return True
    return False


def check_dark_mode(path: str, text: str, enabled: bool) -> list[Finding]:
    if not enabled or Path(path).suffix.lower() not in {".html", ".jsx", ".tsx"}:
        return []
    findings: list[Finding] = []
    class_re = re.compile(r"(?:class|className)\s*=\s*(?:\{?`|\{?[\"'])(.*?)(?:`\}?|[\"']\}?)")
    for line_number, line in enumerate(text.splitlines(), 1):
        match = class_re.search(line)
        if not match:
            continue
        classes = match.group(1)
        if re.search(r"\bbg-(?:white|gray-50|slate-50|zinc-50)\b", classes) and "dark:bg-" not in classes:
            findings.append(Finding(
                "warning", "ui.dark-surface", path,
                f"line {line_number}: bright surface has no dark:bg-* counterpart",
            ))
        if re.search(r"\btext-(?:black|gray-900|slate-900|zinc-900)\b", classes) and "dark:text-" not in classes:
            findings.append(Finding(
                "warning", "ui.dark-text", path,
                f"line {line_number}: dark text has no dark:text-* counterpart",
            ))
    return findings
