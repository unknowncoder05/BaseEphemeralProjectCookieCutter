"""Run with python -m unittest discover -s tests (Jinja2 and PyYAML required)."""
from pathlib import Path
import unittest

from jinja2 import Environment
import yaml


class ManifestContractTests(unittest.TestCase):
    def manifests(self):
        root = Path(__file__).resolve().parents[1] / '{{cookiecutter.project_slug}}'
        for name in ('projectmaker.dev.yml', 'projectmaker.yml'):
            yield name, yaml.safe_load(Environment().from_string((root / name).read_text()).render())

    def test_theme_definitions_are_top_level_at_their_consumption_boundary(self):
        for name, config in self.manifests():
            with self.subTest(manifest=name):
                frontend = config['services']['frontend']
                fields = frontend['env'] if name.endswith('.dev.yml') else frontend['build']['args']
                for family in ('PRIMARY', 'SECONDARY', 'SUCCESS', 'WARNING', 'DANGER', 'INFO'):
                    self.assertIn('REACT_APP_' + family + '_50', fields)
                    self.assertIn('REACT_APP_' + family + '_500', fields)
                for definition in fields.values():
                    if isinstance(definition, dict):
                        self.assertFalse(any(key.startswith('REACT_APP_') for key in definition))

    def test_service_commands_have_explicit_exec_form(self):
        for name, config in self.manifests():
            for service, spec in config['services'].items():
                if 'command' in spec:
                    with self.subTest(manifest=name, service=service):
                        self.assertIsInstance(spec['command'], list)
                        self.assertTrue(spec['command'])
                        self.assertTrue(all(isinstance(arg, str) for arg in spec['command']))


if __name__ == '__main__':
    unittest.main()
