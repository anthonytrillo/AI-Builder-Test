export const AUTH_SESSION_EVENT = "auth-session-changed";

const LEGACY_AUTH_STORAGE_KEYS = [
  "ai-builder.users",
  "ai-builder.session",
  "users",
  "registeredUsers",
  "gym-tracker.users",
] as const;

export type AuthSession = {
  isAuthenticated: true;
  userId: string;
  fullName: string;
  email: string;
};

export type AuthField =
  "fullName" | "email" | "password" | "confirmPassword" | "terms";

export type AuthActionFailure = {
  ok: false;
  message: string;
  field?: AuthField;
};

export type RegisterActionResult =
  { ok: true; fullName: string } | AuthActionFailure;

export type LoginActionResult = { ok: true } | AuthActionFailure;

export function clearLegacyAuthStorage(): void {
  if (typeof window === "undefined") return;

  for (const key of LEGACY_AUTH_STORAGE_KEYS) {
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  }
}
