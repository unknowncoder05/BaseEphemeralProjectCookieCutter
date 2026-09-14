import json
import os
import stat
import subprocess
import tempfile
import threading
import unittest
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

CLI = str(Path(__file__).parents[1] / "app")


class Handler(BaseHTTPRequestHandler):
    requests = []

    def log_message(self, *args):
        pass

    def reply(self, status, value, headers=None):
        body = json.dumps(value).encode()
        self.send_response(status)
        for key, val in (headers or {}).items():
            self.send_header(key, val)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def handle_request(self):
        size = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(size) if size else b""
        body = (raw if self.headers.get("Content-Type", "").startswith("multipart/")
                else json.loads(raw) if raw else None)
        self.requests.append((self.command, self.path, dict(self.headers), body))
        if self.path == "/api/v1/auth/login/":
            if body.get("password") == "secret":
                return self.reply(200, {"access": "jwt-secret", "refresh": "unused"})
            return self.reply(401, {"password": ["submitted password is bad"],
                                    "detail": "invalid credentials: " + body.get("password", "")})
        if self.path in ("/api/v1/schema/", "/api/v1/openapi.json"):
            return self.reply(200, {"openapi": "3.0.0", "paths": {"/items/": {"get": {}, "post": {}}}})
        if self.path == "/api/v1/health/":
            return self.reply(200, {"status": "healthy"})
        if self.path == "/api/v1/redirect/":
            return self.reply(302, {}, {"Location": "http://example.invalid/steal"})
        if self.path == "/api/v1/token-error/":
            return self.reply(400, {"detail": "bad credential " + self.headers.get("Authorization", "")})
        if self.path == "/api/v1/export/":
            payload = b"export-bytes"
            self.send_response(200)
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            return self.wfile.write(payload)
        return self.reply(200, {"method": self.command,
                                "body": "multipart" if isinstance(body, bytes) else body})

    do_GET = do_POST = do_PATCH = do_PUT = do_DELETE = handle_request


class CliTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = HTTPServer(("127.0.0.1", 0), Handler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()

    def setUp(self):
        Handler.requests[:] = []
        self.temp = tempfile.TemporaryDirectory()
        self.env = dict(os.environ, XDG_CONFIG_HOME=self.temp.name)
        self.base = "http://127.0.0.1:{0}/api/v1/".format(self.server.server_port)

    def tearDown(self):
        self.temp.cleanup()

    def run_cli(self, *args, input=None):
        return subprocess.run([CLI, "--api-url", self.base] + list(args), input=input,
                              text=True, capture_output=True, env=self.env)

    def test_health_login_authenticated_crud_logout_and_permissions(self):
        self.assertEqual(self.run_cli("health").returncode, 0)
        login = self.run_cli("login", "--email", "me@example.com", "--password-stdin", input="secret\n")
        self.assertEqual(login.returncode, 0, login.stderr)
        path = Path(self.temp.name) / "{{ cookiecutter.project_slug }}" / "cli.json"
        self.assertEqual(stat.S_IMODE(path.stat().st_mode), 0o600)
        created = self.run_cli("post", "items/", "--data", '{"name":"one"}')
        self.assertEqual(json.loads(created.stdout)["body"], {"name": "one"})
        self.assertEqual(Handler.requests[-1][2]["Authorization"], "Bearer jwt-secret")
        for method in ("get", "patch", "put", "delete"):
            args = (method, "items/1/") if method in ("get", "delete") else (method, "items/1/", "--data", "{}")
            self.assertEqual(self.run_cli(*args).returncode, 0)
        self.assertEqual(self.run_cli("logout").returncode, 0)
        self.assertNotIn("token", json.loads(path.read_text())["profiles"]["default"])

    def test_errors_hide_field_payload_and_redirect_is_refused(self):
        bad = self.run_cli("login", "--email", "me@example.com", "--password-stdin", input="wrong\n")
        self.assertEqual(bad.returncode, 1)
        self.assertIn("invalid credentials", bad.stderr)
        self.assertNotIn("submitted password", bad.stderr)
        self.assertNotIn("wrong", bad.stderr)
        redirected = self.run_cli("get", "redirect/")
        self.assertEqual(redirected.returncode, 1)
        self.assertIn("redirect refused", redirected.stderr)

    def test_absolute_routes_are_rejected_before_network(self):
        result = self.run_cli("get", "https://example.invalid/private")
        self.assertEqual(result.returncode, 1)
        self.assertIn("must be relative", result.stderr)

    def test_authenticated_upload_and_download(self):
        self.assertEqual(self.run_cli("login", "--email", "me@example.com", "--password-stdin", input="secret\n").returncode, 0)
        source = Path(self.temp.name) / "clip.bin"
        source.write_bytes(b"video-data")
        uploaded = self.run_cli("upload", "media/", "--file", "file=" + str(source), "--field", "title=Demo")
        self.assertEqual(uploaded.returncode, 0, uploaded.stderr)
        headers = Handler.requests[-1][2]
        self.assertTrue(headers["Content-Type"].startswith("multipart/form-data; boundary="))
        self.assertEqual(headers["Authorization"], "Bearer jwt-secret")
        output = Path(self.temp.name) / "report.zip"
        downloaded = self.run_cli("download", "export/", "--output", str(output))
        self.assertEqual(downloaded.returncode, 0, downloaded.stderr)
        self.assertEqual(output.read_bytes(), b"export-bytes")

    def test_schema_uses_backend_route_and_rejects_non_schema(self):
        result = self.run_cli("schema")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(json.loads(result.stdout), [
            {"method": "GET", "path": "/items/"},
            {"method": "POST", "path": "/items/"},
        ])
        expected = json.loads(Path(CLI).with_name("config.json").read_text())["schema_path"]
        self.assertEqual(Handler.requests[-1][1], "/api/v1/" + expected)
        failed = self.run_cli("schema", "--schema-route", "health/")
        self.assertEqual(failed.returncode, 1)
        self.assertIn("OpenAPI", failed.stderr)

    def test_saved_token_never_crosses_api_base(self):
        self.assertEqual(self.run_cli("login", "--email", "me@example.com", "--password-stdin", input="secret\n").returncode, 0)
        second = HTTPServer(("127.0.0.1", 0), Handler)
        thread = threading.Thread(target=second.serve_forever, daemon=True)
        thread.start()
        other = "http://127.0.0.1:{0}/api/v1/".format(second.server_port)
        try:
            Handler.requests[:] = []
            health = subprocess.run([CLI, "--api-url", other, "health"], text=True,
                                    capture_output=True, env=self.env)
            self.assertEqual(health.returncode, 0, health.stderr)
            self.assertNotIn("Authorization", Handler.requests[-1][2])
            before = len(Handler.requests)
            refused = subprocess.run([CLI, "--api-url", other, "get", "items/"], text=True,
                                     capture_output=True, env=self.env)
            self.assertEqual(refused.returncode, 1)
            self.assertEqual(len(Handler.requests), before)
            self.assertIn("different API URL", refused.stderr)
        finally:
            second.shutdown()
            second.server_close()

    def test_http_error_redacts_saved_token(self):
        self.assertEqual(self.run_cli("login", "--email", "me@example.com", "--password-stdin", input="secret\n").returncode, 0)
        failed = self.run_cli("get", "token-error/")
        self.assertEqual(failed.returncode, 1)
        self.assertIn("[redacted]", failed.stderr)
        self.assertNotIn("jwt-secret", failed.stderr)

    def test_token_without_issuing_api_fails_cleanly(self):
        path = Path(self.temp.name) / "{{ cookiecutter.project_slug }}" / "cli.json"
        path.parent.mkdir(parents=True)
        path.write_text(json.dumps({"profiles": {"default": {"token": "orphan"}}}))
        failed = self.run_cli("get", "items/")
        self.assertEqual(failed.returncode, 1)
        self.assertIn("different API URL", failed.stderr)
        self.assertNotIn("Traceback", failed.stderr)


if __name__ == "__main__":
    unittest.main()
