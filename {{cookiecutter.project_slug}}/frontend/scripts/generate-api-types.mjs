import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const outFile = 'src/generated/api-types.ts';
const localSchema = '../BackEndApi/src/openapi.schema.json';
const schemaSource = existsSync(localSchema)
  ? localSchema
  : (process.env.API_SCHEMA_URL || 'http://backend:8000/api/v1/schema/');

const result = spawnSync('openapi-typescript', [schemaSource, '-o', outFile], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
