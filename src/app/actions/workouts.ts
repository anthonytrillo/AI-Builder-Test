"use server";

import { readAuthSession } from "@/lib/auth";
import {
  saveFinishedWorkout as persistFinishedWorkout,
  type SaveWorkoutResult,
} from "@/lib/workouts";

export async function saveFinishedWorkout(
  input: unknown,
): Promise<SaveWorkoutResult> {
  const session = await readAuthSession();

  if (!session) {
    return {
      ok: false,
      message: "Inicia sesión para guardar el entrenamiento.",
    };
  }

  return persistFinishedWorkout(session.userId, input);
}
