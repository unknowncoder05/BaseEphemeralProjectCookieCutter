import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const frontendRoot = fileURLToPath(new URL('..', import.meta.url));
const projectRoot = path.dirname(frontendRoot);
const localSchema = path.join(frontendRoot, 'src/generated/openapi.schema.json');
const outFile = path.join(frontendRoot, 'src/generated/api-types.ts');
let schemaSource = process.env.API_SCHEMA_URL;

if (!schemaSource) {
  if (existsSync(path.join(projectRoot, 'BackEndApi/src/manage.py'))) {
    // Always derive from this checkout, so backend edits cannot reuse stale types.
    const generation = spawnSync('python3', [path.join(projectRoot, 'scripts/generate-api-schema.py')], {
      cwd: projectRoot,
      stdio: 'inherit',
    });
    if (generation.error || generation.status !== 0) {
      console.error('Backend schema generation failed. Docker and the declared backend dependencies are required.');
      process.exit(generation.status ?? 1);
    }
  }
  if (!existsSync(localSchema)) {
    console.error('No backend schema is available. Run python3 scripts/generate-api-schema.py from the full checkout, or set API_SCHEMA_URL explicitly.');
    process.exit(1);
  }
  schemaSource = localSchema;
}

const result = spawnSync('openapi-typescript', [schemaSource, '-o', outFile], {
  cwd: frontendRoot,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
if (result.error || result.status !== 0) process.exit(result.status ?? 1);
