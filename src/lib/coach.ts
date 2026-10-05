import "server-only";

import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";
import type { CoachAdvice, CoachResult } from "@/lib/coach-result";
import { env } from "@/lib/env";
import type { WorkoutHome } from "@/lib/workout-home";
import { loadWorkoutHome } from "@/lib/workouts";

const COACH_MODEL = "gemini-2.5-flash";

const adviceSchema = z.object({
  summary: z.string().trim().min(1).max(500),
  tips: z.array(z.string().trim().min(1).max(220)).min(2).max(3),
});

function formatRoutine(home: WorkoutHome) {
  const exercises = home.routine.exercises.map((exercise) => {
    const sets = exercise.sets
      .map((set) => `${set.weight} kg x ${set.reps}`)
      .join(", ");
    const last = exercise.lastPerformance
      ? ` · última serie hecha: ${exercise.lastPerformance}`
      : "";

    return `- ${exercise.name}: ${sets}${last}`;
  });

  return [
    `Rutina: ${home.routine.name} (${home.routine.dayLabel}, ~${home.routine.estimatedMinutes} min)`,
    ...exercises,
  ].join("\n");
}

function formatHistory(home: WorkoutHome) {
  return home.history
    .slice(0, 5)
    .map(
      (entry) =>
        `- ${entry.finishedLabel}: ${entry.routineName}, ${entry.elapsedSeconds}s, volumen ${Math.round(entry.volumeKg)} kg, ${entry.setCount} series, mejor ${entry.bestLift} (${entry.bestDetail})`,
    )
    .join("\n");
}

function buildPrompt(home: WorkoutHome) {
  return `Eres el coach de un tracker de gimnasio. Responde en español rioplatense, breve y concreto.
No des consejos médicos. No inventes ejercicios ni números que no estén en los datos.
Comenta la última sesión y sugiere cómo encarar la próxima, usando solo la rutina y el historial.

Semana: ${home.completedThisWeek} entrenamientos. Racha: ${home.streakWeeks} semanas.

${formatRoutine(home)}

Historial reciente:
${formatHistory(home)}

Devuelve un resumen de una o dos oraciones y entre 2 y 3 consejos cortos.`;
}

export async function generateSessionCoach(
  userId: string,
): Promise<CoachResult> {
  const apiKey = env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      ok: false,
      message: "El coach no está configurado en el servidor.",
    };
  }

  let home: WorkoutHome;

  try {
    home = await loadWorkoutHome(userId);
  } catch (error) {
    console.error("Failed to load workout for coach", error);
    return { ok: false, message: "No se pudo leer tu entrenamiento." };
  }

  if (home.history.length === 0) {
    return {
      ok: false,
      message: "Finaliza un entrenamiento para pedir un consejo.",
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: COACH_MODEL,
      contents: buildPrompt(home),
      config: {
        temperature: 0.4,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            tips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["summary", "tips"],
        },
      },
    });
    const parsed = adviceSchema.safeParse(JSON.parse(response.text ?? ""));

    if (!parsed.success) {
      return {
        ok: false,
        message: "El coach devolvió un formato inesperado.",
      };
    }

    return { ok: true, advice: parsed.data };
  } catch (error) {
    console.error(
      "Gemini coach failed",
      error instanceof Error ? error.message : "unknown error",
    );
    return {
      ok: false,
      message: "No se pudo pedir el consejo. Inténtalo de nuevo.",
    };
  }
}
