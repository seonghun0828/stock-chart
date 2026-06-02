import { existsSync, readFileSync } from 'node:fs';
import { z } from 'zod';

const envSchema = z.object({
  BACKEND_HOST: z.string().default('127.0.0.1'),
  BACKEND_PORT: z.string().default('4000'),
  FRONTEND_ORIGIN: z.string().default('http://localhost:5173'),
  LS_APP_KEY: z.string().optional(),
  LS_APP_SECRET: z.string().optional(),
  LS_BASE_URL: z.string().optional(),
  LS_WS_URL: z.string().optional(),
  USE_MOCK_LS: z.enum(['true', 'false']).default('true'),
});

export function readEnv(input: NodeJS.ProcessEnv = process.env) {
  return envSchema.parse({
    ...readDotEnvFile(),
    ...input,
  });
}

function readDotEnvFile() {
  const envFileUrl = new URL('../../.env', import.meta.url);

  if (!existsSync(envFileUrl)) {
    return {};
  }

  const source = readFileSync(envFileUrl, 'utf8');
  const entries = source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const separatorIndex = line.indexOf('=');
      if (separatorIndex === -1) {
        return null;
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();
      return [key, value] as const;
    })
    .filter((entry): entry is readonly [string, string] => entry !== null);

  return Object.fromEntries(entries);
}
