/**
 * Startup configuration, in one place.
 *
 * 1. `env`  — every environment variable, validated once with Zod. A missing
 *             or weak JWT secret fails here instead of silently becoming
 *             `undefined` deep inside a request at 3am.
 * 2. `connectDB` / `disconnectDB` — the MongoDB connection, cached so
 *             serverless platforms reuse one connection instead of opening
 *             a new one per request.
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { z } from 'zod';

dotenv.config();

/* ------------------------------ environment ------------------------------- */

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),

  MONGODB_URI: z.string().min(1).default('mongodb://localhost:27017/taskflow'),

  // A weak signing key would let anyone forge a login token.
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),

  // Anything the `jsonwebtoken` library accepts: "7d", "12h", "3600", ...
  JWT_EXPIRES_IN: z.string().min(1).default('7d'),

  // Comma separated list of allowed browser origins.
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');

  throw new Error(`Invalid environment configuration:\n${details}`);
}

const raw = parsed.data;

export const env = {
  ...raw,
  isProduction: raw.NODE_ENV === 'production',
  /** Normalised allow-list handed to the CORS middleware. */
  corsOrigins: raw.CORS_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};

/* ------------------------------- database --------------------------------- */

let connection: Promise<typeof mongoose> | null = null;

mongoose.connection.on('error', (error) => console.error('[mongo] connection error:', error));
mongoose.connection.on('disconnected', () => console.warn('[mongo] disconnected'));

export const connectDB = (): Promise<typeof mongoose> => {
  if (connection) return connection;

  mongoose.set('strictQuery', true);

  connection = mongoose
    .connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 })
    .then((instance) => {
      console.log(`[mongo] connected to ${instance.connection.host}/${instance.connection.name}`);
      return instance;
    })
    .catch((error) => {
      connection = null; // let a later call retry instead of replaying the failure
      console.error('[mongo] failed to connect:', error);
      throw error;
    });

  return connection;
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.connection.close();
  connection = null;
};