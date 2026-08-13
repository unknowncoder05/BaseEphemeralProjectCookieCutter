import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const outFile = 'src/generated/api-types.ts';
const localSchema = '../BackEndApi/src/openapi.schema.json';

async function isReachable(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok || response.status === 405;
  } catch {
    return false;
  }
}

async function resolveSchemaSource() {
  if (existsSync(localSchema)) return localSchema;
  if (process.env.API_SCHEMA_URL) return process.env.API_SCHEMA_URL;

  const backendPort = process.env.BACKEND_PORT || process.env.REACT_APP_BACKEND_PORT || '8000';
  const candidates = [
    `http://127.0.0.1:${backendPort}/api/v1/schema/`,
    `http://localhost:${backendPort}/api/v1/schema/`,
    'http://backend:8000/api/v1/schema/',
  ];

  for (const candidate of candidates) {
    if (await isReachable(candidate)) return candidate;
  }

  return candidates[0];
}

const schemaSource = await resolveSchemaSource();

const result = spawnSync('openapi-typescript', [schemaSource, '-o', outFile], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
