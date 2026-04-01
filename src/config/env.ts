import dotenv from 'dotenv';
dotenv.config();

interface Env {
  PORT: number;
  NODE_ENV: string;
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRES_IN: string;
  FRONTEND_URL: string;
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_USER: string;
  SMTP_PASS: string;
  NOTIFY_EMAIL: string;
}

function optional(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

export function validateEnv(): void {
  const required = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];
  for (const v of required) {
    if (!process.env[v]) throw new Error(`Missing required environment variable: ${v}`);
  }
}

export const env: Env = {
  PORT:                   parseInt(optional('PORT', '4000'), 10),
  NODE_ENV:               optional('NODE_ENV', 'development'),
  DB_HOST:                optional('DB_HOST', 'localhost'),
  DB_PORT:                parseInt(optional('DB_PORT', '5432'), 10),
  DB_NAME:                optional('DB_NAME', 'SuitexTechDB'),
  DB_USER:                optional('DB_USER', 'postgres'),
  DB_PASSWORD:            optional('DB_PASSWORD', ''),
  JWT_SECRET:             optional('JWT_SECRET', 'fallback-secret'),
  JWT_EXPIRES_IN:         optional('JWT_EXPIRES_IN', '15m'),
  JWT_REFRESH_SECRET:     optional('JWT_REFRESH_SECRET', 'fallback-refresh-secret'),
  JWT_REFRESH_EXPIRES_IN: optional('JWT_REFRESH_EXPIRES_IN', '7d'),
  FRONTEND_URL:           optional('FRONTEND_URL', 'http://localhost:3000'),
  SMTP_HOST:              optional('SMTP_HOST', 'smtp.gmail.com'),
  SMTP_PORT:              parseInt(optional('SMTP_PORT', '587'), 10),
  SMTP_USER:              optional('SMTP_USER', ''),
  SMTP_PASS:              optional('SMTP_PASS', ''),
  NOTIFY_EMAIL:           optional('NOTIFY_EMAIL', ''),
};
