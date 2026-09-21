"use server";

import {
  loginUser,
  logoutUser,
  readAuthSession,
  registerUser,
} from "@/lib/auth";
import type {
  AuthSession,
  LoginActionResult,
  RegisterActionResult,
} from "@/lib/auth-session";

export async function registerAccount(
  input: unknown,
): Promise<RegisterActionResult> {
  return registerUser(input);
}

export async function loginAccount(input: unknown): Promise<LoginActionResult> {
  return loginUser(input);
}

export async function logoutAccount(): Promise<void> {
  await logoutUser();
}

export async function getAuthSession(): Promise<AuthSession | null> {
  return readAuthSession();
}
