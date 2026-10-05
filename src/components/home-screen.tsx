"use client";

import { GuestHome } from "@/components/guest-home";
import { GymDashboard } from "@/components/gym-dashboard";
import { useAuthSession } from "@/hooks/use-auth-session";
import type { AuthSession } from "@/lib/auth-session";
import type { WorkoutHome } from "@/lib/workout-home";

export function HomeScreen({
  initialSession,
  workoutHome,
}: {
  initialSession: AuthSession | null;
  workoutHome: WorkoutHome | null;
}) {
  const session = useAuthSession(initialSession);

  if (!session || !workoutHome) return <GuestHome />;

  return <GymDashboard session={session} workoutHome={workoutHome} />;
}
