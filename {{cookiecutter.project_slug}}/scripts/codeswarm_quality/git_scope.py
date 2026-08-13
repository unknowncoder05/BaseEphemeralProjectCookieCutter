from __future__ import annotations

import subprocess
from pathlib import Path


def run_git(root: Path, *args: str) -> str:
    result = subprocess.run(
        ["git", *args],
        cwd=root,
        text=True,
        capture_output=True,
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or result.stdout.strip())
    return result.stdout


def selected_paths(root: Path, *, staged: bool, changed_from: str = "") -> tuple[list[str], set[str]]:
    if changed_from:
        try:
            changed = run_git(
                root, "diff", "--name-only", "--diff-filter=ACMR", "-z",
                f"{changed_from}...HEAD",
            )
            added_from_ref = run_git(
                root, "diff", "--name-only", "--diff-filter=A", "-z",
                f"{changed_from}...HEAD",
            )
        except RuntimeError:
            changed = ""
            added_from_ref = ""
        staged_names = run_git(root, "diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z")
        staged_added = run_git(root, "diff", "--cached", "--name-only", "--diff-filter=A", "-z")
        return (
            sorted({item for item in (changed + staged_names).split("\0") if item}),
            {item for item in (added_from_ref + staged_added).split("\0") if item},
        )
    if staged:
        names = run_git(root, "diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z")
        added = run_git(root, "diff", "--cached", "--name-only", "--diff-filter=A", "-z")
        return (
            sorted({item for item in names.split("\0") if item}),
            {item for item in added.split("\0") if item},
        )
    names = run_git(root, "ls-files", "-z")
    return sorted({item for item in names.split("\0") if item}), set()


def added_line_count(root: Path, path: str, changed_from: str = "") -> int:
    counts: list[int] = []
    commands = [["diff", "--cached", "--numstat", "--", path]]
    if changed_from:
        commands.append(["diff", "--numstat", f"{changed_from}...HEAD", "--", path])
    for command in commands:
        try:
            output = run_git(root, *command).strip()
        except RuntimeError:
            continue
        if output:
            added = output.split("\t", 1)[0]
            if added.isdigit():
                counts.append(int(added))
    return max(counts, default=0)
