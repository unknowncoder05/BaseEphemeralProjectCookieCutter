#!/usr/bin/env python3
"""Generate this checkout's OpenAPI contract without starting the application."""
import json
from pathlib import Path
import subprocess
import tempfile


def main():
    root = Path(__file__).resolve().parents[1]
    output = root / 'frontend/src/generated/openapi.schema.json'
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(dir=output.parent, suffix='.json', delete=False) as temporary:
        pending = Path(temporary.name)
    try:
        subprocess.run([
            'docker', 'compose', '-f', str(root / 'docker-compose.dev.yml'),
            'run', '--build', '--rm', '--no-deps', '-T',
            '-e', 'DJANGO_SETTINGS_MODULE=config.settings.schema',
            '-e', 'AWS_EC2_METADATA_DISABLED=true',
            'backend', 'python', 'manage.py', 'spectacular',
            '--format', 'openapi-json', '--validate',
            '--file', '/project/' + pending.relative_to(root).as_posix(),
        ], cwd=root, check=True, timeout=900)
        schema = json.loads(pending.read_text())
        if not str(schema.get('openapi', '')).startswith('3.') or not schema.get('paths'):
            raise ValueError('The backend generated no usable OpenAPI paths.')
        pending.replace(output)
    finally:
        pending.unlink(missing_ok=True)
    print('Generated frontend/src/generated/openapi.schema.json from the backend checkout.')


if __name__ == '__main__':
    main()
