from __future__ import annotations

import argparse
import json

from .config import ROOT, active_exception, load_config, matches_any
from .git_scope import added_line_count, selected_paths
from .models import Finding


SOURCE_SUFFIXES = {
    ".c", ".cc", ".cpp", ".css", ".go", ".html", ".java", ".js",
    ".jsx", ".kt", ".php", ".py", ".rb", ".rs", ".scss", ".sh",
    ".sql", ".swift", ".ts", ".tsx", ".vue",
}


def _is_binary(raw: bytes) -> bool:
    return b"\0" in raw[:8192]


def _check_file(
    path: str,
    *,
    config: dict,
    technologies: set[str],
    dark_mode_enabled: bool,
    changed_from: str,
    all_files: bool,
) -> list[Finding]:
    absolute = ROOT / path
    if not absolute.is_file():
        return []
    try:
        raw = absolute.read_bytes()
    except OSError as exc:
        return [Finding("error", "file.read", path, str(exc))]

    findings: list[Finding] = []
    if len(raw) > int(config["max_file_bytes"]):
        findings.append(Finding(
            "error", "file.bytes", path,
            f"file is {len(raw)} bytes; maximum is {config['max_file_bytes']}",
        ))
    if _is_binary(raw):
        return findings

    text = raw.decode("utf-8", errors="replace")
    suffix = absolute.suffix.lower()
    if suffix in SOURCE_SUFFIXES and not matches_any(path, [str(item) for item in config.get("exclude", [])]):
        line_count = len(text.splitlines())
        if line_count > int(config["max_source_lines"]):
            findings.append(Finding(
                "error", "file.lines", path,
                f"source file has {line_count} lines; maximum is {config['max_source_lines']}",
            ))
        elif line_count > int(config["warn_source_lines"]):
            findings.append(Finding(
                "warning", "file.lines", path,
                f"source file has {line_count} lines; consider splitting it",
            ))
        if not all_files and added_line_count(ROOT, path, changed_from) > int(config["warn_added_lines"]):
            findings.append(Finding(
                "warning", "file.added-lines", path,
                f"change adds more than {config['warn_added_lines']} lines to one source file",
            ))

    if suffix == ".json":
        try:
            json.loads(text)
        except json.JSONDecodeError as exc:
            findings.append(Finding("error", "json.syntax", path, str(exc)))
    if suffix == ".py" and "django" in technologies:
        from .django_migrations import check_django
        findings.extend(check_django(path, text))
    if suffix == ".py" and "alembic" in technologies:
        from .alembic_migrations import check_alembic
        findings.extend(check_alembic(path, text))
    if dark_mode_enabled:
        from .web import check_dark_mode
        findings.extend(check_dark_mode(path, text, True))
    return findings


def main() -> int:
    parser = argparse.ArgumentParser()
    scope = parser.add_mutually_exclusive_group()
    scope.add_argument("--staged", action="store_true", help="check staged files")
    scope.add_argument("--all", action="store_true", help="check all tracked files")
    scope.add_argument("--changed-from", metavar="REF", help="check branch changes plus staged files")
    args = parser.parse_args()

    try:
        config = load_config()
        paths, _added_paths = selected_paths(
            ROOT,
            staged=not args.all and not args.changed_from,
            changed_from=str(args.changed_from or ""),
        )
    except (OSError, ValueError, RuntimeError, json.JSONDecodeError) as exc:
        print(f"[ERROR] quality.config {exc}")
        return 2

    technologies = {str(item).strip().lower() for item in config.get("technologies", [])}
    dark_mode_enabled = False
    if {"dark_mode", "tailwind_dark"} & technologies:
        from .web import repository_uses_dark_mode
        dark_mode_enabled = repository_uses_dark_mode(ROOT)
    findings: list[Finding] = []
    for path in paths:
        findings.extend(_check_file(
            path,
            config=config,
            technologies=technologies,
            dark_mode_enabled=dark_mode_enabled,
            changed_from=str(args.changed_from or ""),
            all_files=bool(args.all),
        ))
    if "i18next" in technologies:
        from .web import check_translation_parity
        findings.extend(check_translation_parity(ROOT, config, set(paths)))

    actionable = [
        finding for finding in findings
        if not active_exception(finding.path, finding.rule, config)
    ]
    for finding in actionable:
        print(f"[{finding.severity.upper()}] {finding.rule} {finding.path}: {finding.message}")

    errors = [finding for finding in actionable if finding.severity == "error"]
    warnings = [finding for finding in actionable if finding.severity == "warning"]
    warnings_block = bool(config.get("warnings_as_errors", True))
    if errors or (warnings and warnings_block):
        print(
            f"CODESWARM_QUALITY_FAIL errors={len(errors)} warnings={len(warnings)} "
            f"warnings_as_errors={str(warnings_block).lower()}"
        )
        return 1
    print(f"CODESWARM_QUALITY_PASS checked={len(paths)} warnings={len(warnings)}")
    return 0
