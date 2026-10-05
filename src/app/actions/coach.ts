"use server";

import { readAuthSession } from "@/lib/auth";
import { generateSessionCoach } from "@/lib/coach";
import type { CoachResult } from "@/lib/coach-result";

export async function requestSessionCoach(): Promise<CoachResult> {
  const session = await readAuthSession();

  if (!session) {
    return { ok: false, message: "Inicia sesión para pedir un consejo." };
  }

  return generateSessionCoach(session.userId);
}
