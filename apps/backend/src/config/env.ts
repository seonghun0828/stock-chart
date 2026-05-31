import { z } from 'zod';

const envSchema = z.object({
  BACKEND_PORT: z.string().default('4000'),
  LS_APP_KEY: z.string().optional(),
  LS_APP_SECRET: z.string().optional(),
  LS_BASE_URL: z.string().optional(),
  LS_WS_URL: z.string().optional(),
  USE_MOCK_LS: z.enum(['true', 'false']).default('true'),
});

export function readEnv(input: NodeJS.ProcessEnv = process.env) {
  return envSchema.parse(input);
}
