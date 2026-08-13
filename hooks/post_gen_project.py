#!/usr/bin/env python
"""Post-generation hook for cookiecutter template."""
import os
import shutil
import subprocess
import json

# Template variables (these will be replaced by Jinja2)
PROJECT_NAME = '{{ cookiecutter.project_name }}'
PROJECT_SLUG = '{{ cookiecutter.project_slug }}'
PROJECT_SLUG_DASHED = '{{ cookiecutter.project_slug_dashed }}'
DESCRIPTION = '{{ cookiecutter.description }}'
AUTHOR_NAME = '{{ cookiecutter.author_name }}'
AUTHOR_EMAIL = '{{ cookiecutter.author_email }}'
DOMAIN_NAME = '{{ cookiecutter.domain_name }}'


def replace_in_file(filepath, replacements):
    """Replace strings in a file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content
        for old, new in replacements.items():
            content = content.replace(old, new)

        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
    except (UnicodeDecodeError, FileNotFoundError):
        pass
    return False


def update_package_json():
    """Update package.json with project details."""
    package_json_path = os.path.join('frontend', 'package.json')
    if os.path.exists(package_json_path):
        try:
            with open(package_json_path, 'r') as f:
                data = json.load(f)

            data['name'] = PROJECT_SLUG_DASHED
            data['description'] = DESCRIPTION
            data['author'] = f'{AUTHOR_NAME} <{AUTHOR_EMAIL}>'

            with open(package_json_path, 'w') as f:
                json.dump(data, f, indent=2)
            print(f"Updated {package_json_path}")
        except Exception as e:
            print(f"Warning: Could not update package.json: {e}")


def replace_project_references():
    """Replace hardcoded project references in source files."""
    replacements = {
        # Generic placeholder names
        'MyProject': PROJECT_NAME,
        'myproject': PROJECT_SLUG,
        'my-project': PROJECT_SLUG_DASHED,
        '{{cookiecutter.project_name}}': PROJECT_NAME,
        # Legacy names that might still exist
        'BaseEphemeralCookieCutter': PROJECT_SLUG,
        'base-ephemeral-cookiecutter': PROJECT_SLUG_DASHED,
        'base_ephemeral_cookiecutter': PROJECT_SLUG,
        'ProjectMaker': PROJECT_SLUG,
        'project-maker': PROJECT_SLUG_DASHED,
        # Domain placeholder
        'example.com': DOMAIN_NAME,
        'yerson.co': DOMAIN_NAME,
    }

    # Files and directories to process
    paths_to_process = [
        'frontend/src',
        'frontend/public',
        'frontend',
        'BackEndApi',
        'terraform',
        'scripts',
        'docs',
        '.',  # root level files
    ]

    # File extensions to process
    extensions = {'.ts', '.tsx', '.js', '.jsx', '.py', '.json', '.yaml', '.yml',
                  '.md', '.html', '.tf', '.tfvars', '.sh', '.env', '.txt'}

    # Special filenames to process regardless of extension
    special_files = {'.env', '.env.example', '.env.local', 'Makefile', 'Dockerfile',
                     'docker-compose.yml', 'docker-compose.yaml', 'LICENSE'}

    count = 0
    for base_path in paths_to_process:
        if not os.path.exists(base_path):
            continue

        # For root directory, only process files (not subdirectories)
        if base_path == '.':
            for filename in os.listdir('.'):
                if os.path.isfile(filename):
                    ext = os.path.splitext(filename)[1].lower()
                    if ext in extensions or filename in special_files:
                        if replace_in_file(filename, replacements):
                            count += 1
            continue

        for root, dirs, files in os.walk(base_path):
            # Skip node_modules and other build directories
            dirs[:] = [d for d in dirs if d not in {'node_modules', '__pycache__', '.git', 'build', 'dist', '.terraform', 'staticfiles', '.claude'}]

            for filename in files:
                ext = os.path.splitext(filename)[1].lower()
                if ext in extensions or filename in special_files:
                    filepath = os.path.join(root, filename)
                    if replace_in_file(filepath, replacements):
                        count += 1

    if count > 0:
        print(f"Updated {count} files with project references")


def remove_github_integration():
    """Remove GitHub-related code from the generated project."""
    print("Removing GitHub integration...")

    # Files to process for block removal
    files_to_clean = [
        os.path.join('BackEndApi', 'src', 'api', 'users', 'views', '__init__.py'),
        os.path.join('BackEndApi', 'src', 'api', 'users', 'urls.py'),
        os.path.join('frontend', 'src', 'types', 'auth.ts'),
        os.path.join('frontend', 'src', 'services', 'api.ts'),
        os.path.join('frontend', 'src', 'pages', 'SettingsPage.tsx'),
    ]

    for filepath in files_to_clean:
        if not os.path.exists(filepath):
            continue

        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        new_lines = []
        skip = False
        for line in lines:
            if 'PM_GITHUB_START' in line:
                skip = True
                continue
            if 'PM_GITHUB_END' in line:
                skip = False
                continue
            if not skip:
                new_lines.append(line)

        with open(filepath, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)


def remove_ai_integration():
    """Remove AI-related files and dependencies if not selected."""
    # Files/directories to remove when AI integration is not selected
    ai_related_paths = [
        # Add AI-specific paths here if needed in the future
    ]

    for path in ai_related_paths:
        if os.path.exists(path):
            if os.path.isdir(path):
                shutil.rmtree(path)
            else:
                os.remove(path)

    # Remove AI-related dependencies from requirements
    requirements_file = os.path.join('BackEndApi', 'requirements', 'base.txt')
    if os.path.exists(requirements_file):
        with open(requirements_file, 'r') as f:
            lines = f.readlines()

        ai_packages = ['openai', 'anthropic', 'langchain', 'tiktoken']
        filtered_lines = []
        skip_next = False

        for line in lines:
            # Check if this is an AI package
            is_ai_package = any(pkg in line.lower() for pkg in ai_packages)
            # Check if this is a comment about AI
            is_ai_comment = '# AI' in line or '# Optional AI' in line

            if is_ai_comment:
                skip_next = True
                continue

            if skip_next and is_ai_package:
                skip_next = False
                continue

            skip_next = False
            filtered_lines.append(line)

        with open(requirements_file, 'w') as f:
            f.writelines(filtered_lines)


def init_git_repo():
    """Initialize a fresh git repository."""
    try:
        subprocess.run(['git', 'init'], check=True, capture_output=True)
        subprocess.run(['git', 'add', '.'], check=True, capture_output=True)
        subprocess.run(
            ['git', 'commit', '-m', 'Initial commit from cookiecutter template'],
            check=True,
            capture_output=True
        )
        print("Git repository initialized with initial commit.")
    except subprocess.CalledProcessError as e:
        print(f"Warning: Could not initialize git repository: {e}")
    except FileNotFoundError:
        print("Warning: Git not found. Skipping repository initialization.")


def main():
    """Main post-generation hook."""
    print("Running post-generation hooks...")

    # Update package.json with project details
    print("Updating package.json...")
    update_package_json()

    # Replace project references in source files
    print("Replacing project references...")
    replace_project_references()

    # Remove AI integration if not selected
    if '{{ cookiecutter.use_ai_integration }}' != 'y':
        print("Removing AI integration files...")
        remove_ai_integration()

    # Remove GitHub integration if not selected
    if '{{ cookiecutter.use_github_integration }}' != 'y':
        remove_github_integration()

    # Initialize git repository
    print("Initializing git repository...")
    init_git_repo()

    print("\n" + "=" * 60)
    print("Project '{{ cookiecutter.project_name }}' created successfully!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. cd {{ cookiecutter.project_slug }}")
    print("2. Review and update .env files in BackEndApi/.envs/")
    print("3. Run 'make setup' to initialize the development environment")
    print("4. Run 'make dev' to start the development servers")
    print("\nFor more information, see the README.md file.")


if __name__ == '__main__':
    main()
