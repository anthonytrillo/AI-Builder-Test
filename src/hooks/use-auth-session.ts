"use client";

import { useEffect, useState } from "react";
import {
  AUTH_SESSION_EVENT,
  readAuthSession,
  type AuthSession,
} from "@/lib/auth-storage";

export function useAuthSession(): AuthSession | null {
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    const syncSession = () => {
      setSession(readAuthSession());
    };

    syncSession();
    window.addEventListener("storage", syncSession);
    window.addEventListener(AUTH_SESSION_EVENT, syncSession);

    return () => {
      window.removeEventListener("storage", syncSession);
      window.removeEventListener(AUTH_SESSION_EVENT, syncSession);
    };
  }, []);

  return session;
}
