import "server-only";

import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { env } from "@/lib/env";

export type Sql = NeonQueryFunction<false, false>;

let client: Sql | undefined;
let schemaReady: Promise<void> | null = null;

export function getDb(): Sql {
  if (client) return client;

  const databaseUrl = env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Add your Neon connection string to .env.local.",
    );
  }

  client = neon(databaseUrl);
  return client;
}

export function ensureAuthSchema(): Promise<void> {
  schemaReady ??= applyAuthSchema().catch((error: unknown) => {
    schemaReady = null;
    throw error;
  });

  return schemaReady;
}

async function applyAuthSchema(): Promise<void> {
  const sql = getDb();

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id uuid PRIMARY KEY,
      full_name text NOT NULL,
      email text NOT NULL UNIQUE,
      password_hash text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id uuid PRIMARY KEY,
      user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
      token_hash text NOT NULL UNIQUE,
      expires_at timestamptz NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions (user_id)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions (expires_at)
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS routines (
      id uuid PRIMARY KEY,
      user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
      name text NOT NULL,
      day_label text NOT NULL,
      estimated_minutes integer NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS routines_user_id_idx ON routines (user_id)
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS routine_exercises (
      id uuid PRIMARY KEY,
      routine_id uuid NOT NULL REFERENCES routines (id) ON DELETE CASCADE,
      position integer NOT NULL,
      name text NOT NULL,
      last_weight text,
      last_reps text,
      sets jsonb NOT NULL
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS routine_exercises_routine_id_idx
    ON routine_exercises (routine_id, position)
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS workout_sessions (
      id uuid PRIMARY KEY,
      user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
      routine_id uuid REFERENCES routines (id) ON DELETE SET NULL,
      routine_name text NOT NULL,
      started_at timestamptz NOT NULL,
      finished_at timestamptz NOT NULL,
      elapsed_seconds integer NOT NULL,
      volume_kg numeric NOT NULL,
      set_count integer NOT NULL,
      best_lift text NOT NULL,
      best_detail text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS workout_sessions_user_finished_idx
    ON workout_sessions (user_id, finished_at DESC)
  `;
}
