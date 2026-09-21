import { z } from "zod";

export const USERS_STORAGE_KEY = "ai-builder.users";
export const SESSION_STORAGE_KEY = "ai-builder.session";
export const AUTH_SESSION_EVENT = "auth-session-changed";

const USER_STORAGE_KEYS = [
  USERS_STORAGE_KEY,
  "users",
  "registeredUsers",
  "gym-tracker.users",
] as const;

const registeredUserSchema = z
  .object({
    id: z.string().optional(),
    fullName: z.string().optional(),
    name: z.string().optional(),
    nombre: z.string().optional(),
    nombreCompleto: z.string().optional(),
    email: z.string().optional(),
    correo: z.string().optional(),
    correoElectronico: z.string().optional(),
    password: z.string().optional(),
    contrasena: z.string().optional(),
    contraseña: z.string().optional(),
  })
  .transform((user) => {
    const email = (user.email ?? user.correo ?? user.correoElectronico ?? "")
      .trim()
      .toLowerCase();
    const password = user.password ?? user.contrasena ?? user.contraseña ?? "";
    const fullName = (
      user.fullName ??
      user.nombreCompleto ??
      user.nombre ??
      user.name ??
      ""
    ).trim();

    return {
      id: user.id?.trim() || email,
      fullName,
      email,
      password,
    };
  })
  .refine((user) => user.email.length > 0 && user.password.length > 0);

export type RegisteredUser = z.output<typeof registeredUserSchema>;

const sessionSchema = z.object({
  isAuthenticated: z.literal(true),
  userId: z.string().min(1),
  fullName: z.string(),
  email: z.string().min(1),
});

export type AuthSession = z.infer<typeof sessionSchema>;

function parseJson(value: string | null): unknown {
  if (!value) return null;

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function asUserList(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;

  if (!value || typeof value !== "object") return [];

  const record = value as Record<string, unknown>;

  if (Array.isArray(record.users)) return record.users;

  if (
    "email" in record ||
    "correo" in record ||
    "correoElectronico" in record ||
    "password" in record ||
    "contrasena" in record ||
    "contraseña" in record
  ) {
    return [value];
  }

  return [];
}

function normalizeUsers(entries: unknown[]): RegisteredUser[] {
  const users: RegisteredUser[] = [];
  const seenEmails = new Set<string>();

  for (const entry of entries) {
    const parsed = registeredUserSchema.safeParse(entry);

    if (!parsed.success || seenEmails.has(parsed.data.email)) continue;

    seenEmails.add(parsed.data.email);
    users.push(parsed.data);
  }

  return users;
}

function readUsersFromStorage(storage: Storage): RegisteredUser[] {
  for (const key of USER_STORAGE_KEYS) {
    const users = normalizeUsers(asUserList(parseJson(storage.getItem(key))));

    if (users.length > 0) return users;
  }

  const scanned: unknown[] = [];

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);

    if (!key || key === SESSION_STORAGE_KEY) continue;
    if ((USER_STORAGE_KEYS as readonly string[]).includes(key)) continue;

    scanned.push(...asUserList(parseJson(storage.getItem(key))));
  }

  return normalizeUsers(scanned);
}

export function readRegisteredUsers(): RegisteredUser[] {
  if (typeof window === "undefined") return [];

  const localUsers = readUsersFromStorage(window.localStorage);

  if (localUsers.length > 0) return localUsers;

  return readUsersFromStorage(window.sessionStorage);
}

export class DuplicateEmailError extends Error {
  constructor() {
    super("Este correo ya está registrado");
    this.name = "DuplicateEmailError";
  }
}

export function appendRegisteredUser(input: {
  fullName: string;
  email: string;
  password: string;
}): RegisteredUser[] {
  const email = input.email.trim().toLowerCase();
  const current = readRegisteredUsers();

  if (current.some((user) => user.email === email)) {
    throw new DuplicateEmailError();
  }

  const nextUser: RegisteredUser = {
    id: crypto.randomUUID(),
    fullName: input.fullName.trim(),
    email,
    password: input.password,
  };
  const nextUsers = [...current, nextUser];

  window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(nextUsers));

  return nextUsers;
}

export function findRegisteredUser(
  email: string,
  password: string,
): RegisteredUser | null {
  const normalizedEmail = email.trim().toLowerCase();

  return (
    readRegisteredUsers().find(
      (user) => user.email === normalizedEmail && user.password === password,
    ) ?? null
  );
}

export function saveAuthSession(user: RegisteredUser): AuthSession {
  const session: AuthSession = {
    isAuthenticated: true,
    userId: user.id,
    fullName: user.fullName,
    email: user.email,
  };

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(AUTH_SESSION_EVENT));

  return session;
}

export function readAuthSession(): AuthSession | null {
  if (typeof window === "undefined") return null;

  const raw =
    window.localStorage.getItem(SESSION_STORAGE_KEY) ??
    window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  const parsed = sessionSchema.safeParse(parseJson(raw));

  return parsed.success ? parsed.data : null;
}

export function clearAuthSession(): void {
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
  window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
  window.dispatchEvent(new Event(AUTH_SESSION_EVENT));
}
