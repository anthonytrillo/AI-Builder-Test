"use client";

import { useEffect, useState } from "react";
import { getAuthSession } from "@/app/actions/auth";
import {
  AUTH_SESSION_EVENT,
  clearLegacyAuthStorage,
  type AuthSession,
} from "@/lib/auth-session";

export function useAuthSession(
  initialSession: AuthSession | null = null,
): AuthSession | null {
  const [session, setSession] = useState<AuthSession | null>(initialSession);

  useEffect(() => {
    clearLegacyAuthStorage();

    let active = true;

    const syncSession = () => {
      void getAuthSession().then((nextSession) => {
        if (active) setSession(nextSession);
      });
    };

    syncSession();
    window.addEventListener(AUTH_SESSION_EVENT, syncSession);

    return () => {
      active = false;
      window.removeEventListener(AUTH_SESSION_EVENT, syncSession);
    };
  }, []);

  return session;
}
