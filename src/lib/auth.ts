import "server-only";

import { createHash, randomBytes, randomUUID } from "node:crypto";
import { NeonDbError } from "@neondatabase/serverless";
import { compare, hash } from "bcryptjs";
import { cookies } from "next/headers";
import { z } from "zod";
import type {
  AuthActionFailure,
  AuthField,
  AuthSession,
  LoginActionResult,
  RegisterActionResult,
} from "@/lib/auth-session";
import { ensureAuthSchema, getDb, type Sql } from "@/lib/db";
import { loginSchema } from "@/lib/validations/login";
import { registerSchema } from "@/lib/validations/register";

const SESSION_COOKIE = "gym_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const BCRYPT_ROUNDS = 12;
const DUMMY_PASSWORD_HASH =
  "$2b$12$gmirhfrPRiaM1xOKtWQus.TJeKDg/qBSHA8jus4MPKMOT0X2ZRaEy";

const AUTH_FIELDS = new Set<AuthField>([
  "fullName",
  "email",
  "password",
  "confirmPassword",
  "terms",
]);

function failureFromZod(error: z.ZodError): AuthActionFailure {
  const issue = error.issues[0];
  const path = issue?.path[0];
  const field =
    typeof path === "string" && AUTH_FIELDS.has(path as AuthField)
      ? (path as AuthField)
      : undefined;

  return {
    ok: false,
    message: issue?.message ?? "Revisa los datos del formulario.",
    field,
  };
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof NeonDbError && error.code === "23505";
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

async function createSession(sql: Sql, userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  await sql`
    INSERT INTO sessions (id, user_id, token_hash, expires_at)
    VALUES (
      ${randomUUID()},
      ${userId},
      ${hashToken(token)},
      ${expiresAt.toISOString()}
    )
  `;

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
    expires: expiresAt,
  });
}

export async function registerUser(
  input: unknown,
): Promise<RegisterActionResult> {
  const parsed = registerSchema.safeParse(input);

  if (!parsed.success) return failureFromZod(parsed.error);

  const email = parsed.data.email.trim().toLowerCase();
  const fullName = parsed.data.fullName.trim();
  const passwordHash = await hash(parsed.data.password, BCRYPT_ROUNDS);

  try {
    await ensureAuthSchema();
    const sql = getDb();

    await sql`
      INSERT INTO users (id, full_name, email, password_hash)
      VALUES (${randomUUID()}, ${fullName}, ${email}, ${passwordHash})
    `;
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        ok: false,
        field: "email",
        message: "Este correo ya está registrado",
      };
    }

    console.error("Failed to register user", error);
    return {
      ok: false,
      message: "No se pudo crear la cuenta. Inténtalo de nuevo.",
    };
  }

  return { ok: true, fullName };
}

export async function loginUser(input: unknown): Promise<LoginActionResult> {
  const parsed = loginSchema.safeParse(input);

  if (!parsed.success) return failureFromZod(parsed.error);

  const email = parsed.data.email.trim().toLowerCase();

  try {
    await ensureAuthSchema();
    const sql = getDb();
    const rows = await sql`
      SELECT id, full_name, email, password_hash
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `;
    const user = rows[0];
    const passwordHash = readString(user?.password_hash) ?? DUMMY_PASSWORD_HASH;
    const passwordMatches = await compare(parsed.data.password, passwordHash);
    const userId = readString(user?.id);

    if (!userId || !passwordMatches) {
      return {
        ok: false,
        message: "El correo o la contraseña no son correctos.",
      };
    }

    await createSession(sql, userId);
  } catch (error) {
    console.error("Failed to login", error);
    return {
      ok: false,
      message: "No se pudo iniciar sesión. Inténtalo de nuevo.",
    };
  }

  return { ok: true };
}

export async function readAuthSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) return null;

  try {
    await ensureAuthSchema();
    const sql = getDb();
    const rows = await sql`
      SELECT u.id, u.full_name, u.email
      FROM sessions AS s
      INNER JOIN users AS u ON u.id = s.user_id
      WHERE s.token_hash = ${hashToken(token)}
        AND s.expires_at > now()
      LIMIT 1
    `;
    const row = rows[0];
    const userId = readString(row?.id);
    const fullName = readString(row?.full_name);
    const email = readString(row?.email);

    if (!userId || !fullName || !email) return null;

    return {
      isAuthenticated: true,
      userId,
      fullName,
      email,
    };
  } catch (error) {
    console.error("Failed to read auth session", error);
    return null;
  }
}

export async function logoutUser(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  cookieStore.delete(SESSION_COOKIE);

  if (!token) return;

  try {
    await ensureAuthSchema();
    const sql = getDb();
    await sql`
      DELETE FROM sessions
      WHERE token_hash = ${hashToken(token)}
    `;
  } catch (error) {
    console.error("Failed to delete auth session", error);
  }
}
