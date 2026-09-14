"""Dependency-free command line client for the generated backend API."""
import argparse
import getpass
import json
import os
import re
import stat
import sys
import uuid
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlparse
from urllib.request import HTTPRedirectHandler, Request, build_opener

MANIFEST_PATH = Path(__file__).with_name("config.json")


def manifest():
    try:
        value = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        raise ValueError("CLI manifest is missing or invalid: {0}".format(exc))
    required = ("app_id", "api_url", "health_path", "login_path")
    if not isinstance(value, dict) or any(not isinstance(value.get(key), str) or not value[key] for key in required):
        raise ValueError("CLI manifest must define non-empty " + ", ".join(required))
    if not re.match(r"^[A-Za-z0-9][A-Za-z0-9._-]*$", value["app_id"]):
        raise ValueError("CLI manifest app_id contains unsafe characters")
    return value


class NoRedirects(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise HTTPError(req.full_url, code, "redirect refused", headers, fp)


def config_path():
    root = os.environ.get("XDG_CONFIG_HOME") or str(Path.home() / ".config")
    return Path(root) / manifest()["app_id"] / "cli.json"


def load_config():
    path = config_path()
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
        return value if isinstance(value, dict) else {}
    except (OSError, ValueError):
        return {}


def save_config(value):
    path = config_path()
    path.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
    if path.parent.is_symlink():
        raise ValueError("refusing to store credentials through a symlinked app config directory")
    try:
        os.chmod(str(path.parent), 0o700)
    except OSError:
        pass
    temporary = path.with_name(".{0}.{1}.{2}.tmp".format(path.name, os.getpid(), uuid.uuid4().hex))
    flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL
    if hasattr(os, "O_NOFOLLOW"):
        flags |= os.O_NOFOLLOW
    fd = os.open(str(temporary), flags, 0o600)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as stream:
            json.dump(value, stream, indent=2, sort_keys=True)
            stream.write("\n")
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(str(temporary), str(path))
        os.chmod(str(path), stat.S_IRUSR | stat.S_IWUSR)
    finally:
        try:
            temporary.unlink()
        except FileNotFoundError:
            pass


def profile(config, name):
    profiles = config.setdefault("profiles", {})
    if not isinstance(profiles, dict):
        raise ValueError("CLI profile configuration is invalid")
    value = profiles.setdefault(name, {})
    if not isinstance(value, dict):
        raise ValueError("CLI profile '{0}' is invalid".format(name))
    return value


def safe_url(base, route):
    base_parts = urlparse(base)
    if base_parts.scheme not in ("http", "https") or not base_parts.netloc or base_parts.username or base_parts.password:
        raise ValueError("API URL must be an http(s) origin without embedded credentials")
    parsed = urlparse(route)
    if parsed.scheme or parsed.netloc or route.startswith("//"):
        raise ValueError("API route must be relative (for example: items/1/)")
    base = base.rstrip("/") + "/"
    url = urljoin(base, route.lstrip("/"))
    if (urlparse(url).scheme, urlparse(url).netloc) != (urlparse(base).scheme, urlparse(base).netloc):
        raise ValueError("API route must remain on the configured API origin")
    return url


def request(base, route, method="GET", data=None, token=None, body=None, content_type=None, raw=False, secrets=()):
    if body is None:
        body = None if data is None else json.dumps(data).encode("utf-8")
    headers = {"Accept": "*/*" if raw else "application/json"}
    if body is not None:
        headers["Content-Type"] = content_type or "application/json"
    if token:
        headers["Authorization"] = "Bearer " + token
    req = Request(safe_url(base, route), data=body, headers=headers, method=method)
    try:
        with build_opener(NoRedirects()).open(req, timeout=15) as response:
            response_body = response.read()
            return response.status, response_body if raw else decode(response_body.decode("utf-8", "replace"))
    except HTTPError as exc:
        raw = exc.read().decode("utf-8", "replace") if exc.fp else ""
        detail = decode(raw)
        if 300 <= exc.code < 400:
            raise RuntimeError("server redirect refused")
        message = error_text(detail)
        for secret in tuple(secrets) + ((token,) if token else ()):
            if secret:
                message = message.replace(secret, "[redacted]")
        raise RuntimeError("HTTP {0}: {1}".format(exc.code, message))
    except URLError as exc:
        raise RuntimeError("could not reach API: {0}".format(exc.reason))
    except OSError as exc:
        raise RuntimeError("could not reach API: {0}".format(exc))


def decode(raw):
    if not raw:
        return None
    try:
        return json.loads(raw)
    except ValueError:
        return raw


def error_text(value):
    if isinstance(value, dict):
        for key in ("detail", "message", "error"):
            if key in value and isinstance(value[key], str):
                return value[key]
        return "request failed"
    return value[:300] if isinstance(value, str) else "request failed"


def parse_data(text):
    if text is None:
        return None
    if text == "-":
        text = sys.stdin.read()
    try:
        return json.loads(text)
    except ValueError as exc:
        raise ValueError("request data is not valid JSON: {0}".format(exc))


def multipart(files, fields):
    boundary = "app-cli-" + uuid.uuid4().hex
    chunks = []
    for value in fields or []:
        key, sep, text = value.partition("=")
        if not sep or not key:
            raise ValueError("form fields must use name=value")
        chunks.append(('Content-Disposition: form-data; name="{0}"\r\n\r\n{1}'.format(key, text)).encode())
    for value in files:
        key, sep, filename = value.partition("=")
        if not sep or not key:
            raise ValueError("files must use field=path")
        path = Path(filename)
        chunks.append(('Content-Disposition: form-data; name="{0}"; filename="{1}"\r\n'
                       'Content-Type: application/octet-stream\r\n\r\n'.format(key, path.name)).encode() + path.read_bytes())
    marker = ("--" + boundary).encode()
    body = b"\r\n".join(marker + b"\r\n" + chunk for chunk in chunks) + b"\r\n" + marker + b"--\r\n"
    return body, "multipart/form-data; boundary=" + boundary


def parser():
    root = argparse.ArgumentParser(prog="app", description="Generated backend API client")
    root.add_argument("--api-url")
    root.add_argument("--profile", default="default")
    commands = root.add_subparsers(dest="command", required=True)
    commands.add_parser("health")
    login = commands.add_parser("login")
    identity = login.add_mutually_exclusive_group(required=True)
    identity.add_argument("--email")
    identity.add_argument("--username")
    login.add_argument("--password-stdin", action="store_true")
    login.add_argument("--login-route")
    commands.add_parser("logout")
    for method in ("get", "post", "patch", "put", "delete"):
        item = commands.add_parser(method)
        item.add_argument("route")
        item.add_argument("--data", help="JSON value, or - to read JSON from stdin")
    upload = commands.add_parser("upload")
    upload.add_argument("route")
    upload.add_argument("--file", action="append", required=True, help="field=path (repeatable)")
    upload.add_argument("--field", action="append", help="name=value (repeatable)")
    download = commands.add_parser("download")
    download.add_argument("route")
    download.add_argument("--output", required=True)
    schema = commands.add_parser("schema")
    schema.add_argument("--schema-route")
    return root


def main(argv=None):
    args = parser().parse_args(argv)
    try:
        defaults = manifest()
        config = load_config()
        current = profile(config, args.profile)
        base = args.api_url or os.environ.get("APP_API_URL") or current.get("api_url") or defaults["api_url"]
        saved_base = current.get("api_url")
        token = current.get("token")
        if token and (not isinstance(saved_base, str) or saved_base.rstrip("/") != base.rstrip("/")) and args.command not in ("login", "logout", "health"):
            raise RuntimeError("profile credentials belong to a different API URL; log in to this API or use another profile")
        if args.command == "logout":
            current.pop("token", None)
            save_config(config)
            print("Logged out.")
            return
        if args.command == "login":
            password = sys.stdin.readline().rstrip("\r\n") if args.password_stdin else getpass.getpass()
            key = "email" if args.email else "username"
            payload = {key: args.email or args.username, "password": password}
            _, result = request(base, args.login_route or defaults["login_path"], "POST", payload,
                                secrets=(password,))
            if not isinstance(result, dict):
                raise RuntimeError("login response did not contain an access token")
            access = result.get("access") or result.get("access_token") or result.get("token")
            if not access and isinstance(result.get("tokens"), dict):
                access = result["tokens"].get("access") or result["tokens"].get("access_token")
            if not isinstance(access, str) or not access:
                raise RuntimeError("login response did not contain an access token")
            current.update({"api_url": base, "token": access})
            save_config(config)
            print("Logged in.")
            return
        if args.command == "health":
            _, result = request(base, defaults["health_path"])
        elif args.command == "schema":
            _, document = request(base, args.schema_route or defaults.get("schema_path", "schema/"), token=token)
            if not isinstance(document, dict) or not isinstance(document.get("paths"), dict):
                raise RuntimeError("response is not an OpenAPI document with paths")
            paths = document["paths"]
            result = [{"method": method.upper(), "path": path} for path in sorted(paths)
                      for method in sorted(paths[path]) if method.lower() in {"get", "post", "put", "patch", "delete"}]
        elif args.command == "upload":
            body, content_type = multipart(args.file, args.field)
            result = request(base, args.route, "POST", token=token, body=body, content_type=content_type)[1]
        elif args.command == "download":
            result = request(base, args.route, token=token, raw=True)[1]
            output = Path(args.output)
            output.write_bytes(result)
            print("Saved {0} bytes to {1}".format(len(result), output))
            return
        else:
            result = request(base, args.route, args.command.upper(), parse_data(args.data), token)[1]
        print(json.dumps(result, indent=2, sort_keys=True) if not isinstance(result, str) else result)
    except (RuntimeError, ValueError) as exc:
        print("app: {0}".format(exc), file=sys.stderr)
        raise SystemExit(1)


if __name__ == "__main__":
    main()
