import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const isProduction = (process.env.NODE_ENV || 'development') === 'production';
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  if (isProduction) {
    throw new Error('FATAL: JWT_SECRET environment variable must be set in production!');
  } else if (process.env.NODE_ENV !== 'test') {
    console.warn(
      '[SECURITY WARNING] Using fallback JWT_SECRET. Ensure JWT_SECRET is explicitly configured in .env for production.'
    );
  }
}

export const env = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
  JWT_SECRET: jwtSecret || 'super-secret-stockflow-jwt-key-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  DEFAULT_TAX_PERCENT: process.env.DEFAULT_TAX_PERCENT
    ? parseInt(process.env.DEFAULT_TAX_PERCENT, 10)
    : 11,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
};
