#!/usr/bin/env python3
"""Required backend CLI gate; independent of running services and app dependencies."""
import os
from pathlib import Path
import subprocess
import sys
import unittest


def main():
    root = Path(__file__).resolve().parents[1]
    required = ('cli/app', 'cli/config.json', 'cli/README.md')
    for name in required:
        path = root / name
        if not path.is_file():
            raise SystemExit('Required application CLI file missing: ' + name)
    if not os.access(root / 'cli/app', os.X_OK):
        raise SystemExit('cli/app must be executable')
    if not list((root / 'cli/tests').glob('test_*.py')):
        raise SystemExit('Application CLI behavioral tests are required')
    env = dict(os.environ, PYTHONDONTWRITEBYTECODE='1')
    subprocess.run([sys.executable, 'cli/app', '--help'], cwd=root, env=env,
                   stdout=subprocess.DEVNULL, check=True, timeout=10)
    os.chdir(root)
    sys.dont_write_bytecode = True
    suite = unittest.TestLoader().discover(str(root / 'cli/tests'), pattern='test_*.py')
    if suite.countTestCases() == 0:
        raise SystemExit('Application CLI gate discovered zero tests')
    if not unittest.TextTestRunner().run(suite).wasSuccessful():
        raise SystemExit(1)


if __name__ == '__main__':
    main()
