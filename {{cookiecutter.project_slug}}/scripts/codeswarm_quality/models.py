from dataclasses import dataclass


@dataclass(frozen=True)
class Finding:
    severity: str
    rule: str
    path: str
    message: str
