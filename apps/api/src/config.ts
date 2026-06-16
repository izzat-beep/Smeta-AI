import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Monorepo ildizidagi .env ni yuklaymiz
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config(); // lokal .env ham (agar bo'lsa)

export const config = {
  port: Number(process.env.API_PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  jwt: {
    secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },
  ai: {
    apiKey: process.env.ANTHROPIC_API_KEY ?? '',
    model: process.env.AI_MODEL ?? 'claude-opus-4-8',
  },
  cors: {
    origins: [
      process.env.WEB_ORIGIN ?? 'http://localhost:5173',
      process.env.ADMIN_ORIGIN ?? 'http://localhost:5174',
    ],
  },
};
