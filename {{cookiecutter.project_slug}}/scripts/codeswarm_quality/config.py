from __future__ import annotations

import fnmatch
import json
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
CONFIG_PATH = ROOT / ".codeswarm" / "quality.json"


def load_config() -> dict:
    config = {
        "technologies": [],
        "warnings_as_errors": True,
        "max_file_bytes": 1_048_576,
        "warn_source_lines": 500,
        "max_source_lines": 1000,
        "warn_added_lines": 300,
        "primary_locale": "en",
        "exclude": [],
        "exceptions": [],
    }
    if CONFIG_PATH.is_file():
        payload = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
        if not isinstance(payload, dict):
            raise ValueError(f"{CONFIG_PATH} must contain a JSON object")
        config.update(payload)
    return config


def matches_any(path: str, patterns: list[str]) -> bool:
    return any(fnmatch.fnmatch(path, pattern) for pattern in patterns)


def active_exception(path: str, rule: str, config: dict) -> bool:
    for exception in config.get("exceptions", []):
        if not isinstance(exception, dict):
            continue
        pattern = str(exception.get("path") or "")
        rules = exception.get("rules") or ["*"]
        reason = str(exception.get("reason") or "").strip()
        expires = str(exception.get("expires") or "").strip()
        if not pattern or not reason or not fnmatch.fnmatch(path, pattern):
            continue
        if not any(fnmatch.fnmatch(rule, str(candidate)) for candidate in rules):
            continue
        if expires:
            try:
                if date.fromisoformat(expires) < date.today():
                    continue
            except ValueError:
                continue
        return True
    return False
