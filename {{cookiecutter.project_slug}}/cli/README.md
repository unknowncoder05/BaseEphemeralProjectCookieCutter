# Application CLI

`./cli/app` is a dependency-free Python 3.8+ client for the backend API. It is
suited to local development, smoke tests, and automation.

```bash
./cli/app health
./cli/app login --email user@example.com       # securely prompts for password
printf '%s\n' "$PASSWORD" | ./cli/app login --email user@example.com --password-stdin
./cli/app get items/
./cli/app post items/ --data '{"name":"Example"}'
./cli/app patch items/1/ --data -               # reads JSON from stdin
./cli/app upload media/ --file file=clip.mp4 --field title=Demo
./cli/app download exports/1/ --output report.zip
./cli/app schema
./cli/app logout
```

The API defaults to `http://localhost:8000/api/v1/`. Override it with
`--api-url` or `APP_API_URL`. Named `--profile` values keep separate API URLs
and credentials. Configuration is stored at
`$XDG_CONFIG_HOME/{{ cookiecutter.project_slug }}/cli.json` (normally
`~/.config/{{ cookiecutter.project_slug }}/cli.json`) with owner-only permissions.

Routes must be relative to the configured API origin. Redirects are refused so
an authorization token cannot be forwarded to another origin. Passwords are
never accepted as command-line arguments.

The `media/` and `exports/1/` examples illustrate the upload/download syntax;
use routes implemented by your application.
