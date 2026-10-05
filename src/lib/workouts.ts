import "server-only";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { ensureAuthSchema, getDb } from "@/lib/db";
import {
  buildWeek,
  countStreakWeeks,
  dateKey,
  formatHistoryLabel,
  formatTodayLabel,
  startOfWeek,
  zonedDateParts,
  type RoutineExerciseTemplate,
  type RoutineSetTemplate,
  type WorkoutHistoryEntry,
  type WorkoutHome,
} from "@/lib/workout-home";

const DEFAULT_ROUTINE = {
  name: "Pecho y Tríceps",
  dayLabel: "Día 1",
  estimatedMinutes: 45,
  exercises: [
    {
      name: "Press de banca plano",
      sets: [
        { weight: "80", reps: "10" },
        { weight: "82.5", reps: "8" },
        { weight: "82.5", reps: "8" },
      ],
    },
    {
      name: "Press inclinado con mancuernas",
      sets: [
        { weight: "24", reps: "10" },
        { weight: "24", reps: "10" },
        { weight: "26", reps: "8" },
      ],
    },
    {
      name: "Aperturas en banco",
      sets: [
        { weight: "14", reps: "12" },
        { weight: "14", reps: "12" },
        { weight: "14", reps: "12" },
      ],
    },
    {
      name: "Fondos en paralelas",
      sets: [
        { weight: "0", reps: "8" },
        { weight: "0", reps: "8" },
        { weight: "0", reps: "10" },
      ],
    },
    {
      name: "Extensión de tríceps",
      sets: [
        { weight: "25", reps: "12" },
        { weight: "25", reps: "12" },
        { weight: "27.5", reps: "10" },
      ],
    },
  ],
} as const;

const finishedSetSchema = z.object({
  id: z.number().int().positive(),
  weight: z.string().max(20),
  reps: z.string().max(20),
  status: z.enum(["done", "active", "pending"]),
});

const finishedWorkoutSchema = z.object({
  routineId: z.string().uuid(),
  startedAt: z.number().int(),
  elapsedSeconds: z
    .number()
    .int()
    .min(0)
    .max(60 * 60 * 24),
  exercises: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(80),
        sets: z.array(finishedSetSchema).min(1).max(30),
      }),
    )
    .min(1)
    .max(20),
});

export type FinishedWorkoutInput = z.infer<typeof finishedWorkoutSchema>;

export type SaveWorkoutResult = { ok: true } | { ok: false; message: string };

function readString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readNumber(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isSetTemplate(value: unknown): value is RoutineSetTemplate {
  if (!value || typeof value !== "object") return false;
  const set = value as RoutineSetTemplate;
  return typeof set.weight === "string" && typeof set.reps === "string";
}

function readSets(value: unknown): RoutineSetTemplate[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isSetTemplate);
}

function performanceLabel(weight: string | null, reps: string | null) {
  if (!weight || !reps) return null;
  return `${weight} kg × ${reps} reps`;
}

function parseWeight(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function insertRoutineExercises(routineId: string) {
  const sql = getDb();

  for (const [index, exercise] of DEFAULT_ROUTINE.exercises.entries()) {
    await sql`
      INSERT INTO routine_exercises (
        id,
        routine_id,
        position,
        name,
        sets
      )
      VALUES (
        ${randomUUID()},
        ${routineId},
        ${index},
        ${exercise.name},
        ${JSON.stringify(exercise.sets)}::jsonb
      )
    `;
  }
}

async function ensureDefaultRoutine(userId: string) {
  const sql = getDb();
  const routineId = randomUUID();

  const inserted = await sql`
    INSERT INTO routines (id, user_id, name, day_label, estimated_minutes)
    SELECT
      ${routineId},
      ${userId},
      ${DEFAULT_ROUTINE.name},
      ${DEFAULT_ROUTINE.dayLabel},
      ${DEFAULT_ROUTINE.estimatedMinutes}
    WHERE NOT EXISTS (
      SELECT 1 FROM routines WHERE user_id = ${userId}
    )
    RETURNING id
  `;

  const createdId = readString(inserted[0]?.id);

  if (createdId) await insertRoutineExercises(createdId);
}

export async function loadWorkoutHome(userId: string): Promise<WorkoutHome> {
  await ensureAuthSchema();
  await ensureDefaultRoutine(userId);
  const sql = getDb();

  const routineRows = await sql`
    SELECT id, name, day_label, estimated_minutes
    FROM routines
    WHERE user_id = ${userId}
    ORDER BY created_at ASC
    LIMIT 1
  `;
  const routineRow = routineRows[0];
  const routineId = readString(routineRow?.id);

  if (!routineId) {
    throw new Error("No se pudo preparar la rutina de la cuenta.");
  }

  let exerciseRows = await sql`
    SELECT name, last_weight, last_reps, sets
    FROM routine_exercises
    WHERE routine_id = ${routineId}
    ORDER BY position ASC
  `;

  if (exerciseRows.length === 0) {
    await insertRoutineExercises(routineId);
    exerciseRows = await sql`
      SELECT name, last_weight, last_reps, sets
      FROM routine_exercises
      WHERE routine_id = ${routineId}
      ORDER BY position ASC
    `;
  }

  const exercises: RoutineExerciseTemplate[] = exerciseRows.flatMap((row) => {
    const name = readString(row.name);
    const sets = readSets(row.sets);
    if (!name || sets.length === 0) return [];

    return [
      {
        name,
        lastPerformance: performanceLabel(
          readString(row.last_weight),
          readString(row.last_reps),
        ),
        sets,
      },
    ];
  });

  if (exercises.length === 0) {
    throw new Error("La rutina de la cuenta no tiene ejercicios.");
  }

  const historyRows = await sql`
    SELECT
      id,
      routine_name,
      finished_at,
      elapsed_seconds,
      volume_kg,
      set_count,
      best_lift,
      best_detail
    FROM workout_sessions
    WHERE user_id = ${userId}
    ORDER BY finished_at DESC
    LIMIT 20
  `;

  const history: WorkoutHistoryEntry[] = historyRows.flatMap((row) => {
    const id = readString(row.id);
    const routineName = readString(row.routine_name);
    const finishedAt = row.finished_at;
    const bestLift = readString(row.best_lift);
    const bestDetail = readString(row.best_detail);

    if (!id || !routineName || !bestLift || !bestDetail) return [];

    const finishedDate =
      finishedAt instanceof Date ? finishedAt : new Date(String(finishedAt));

    if (Number.isNaN(finishedDate.getTime())) return [];

    return [
      {
        id,
        routineName,
        finishedLabel: formatHistoryLabel(finishedDate),
        elapsedSeconds: readNumber(row.elapsed_seconds),
        volumeKg: readNumber(row.volume_kg),
        setCount: readNumber(row.set_count),
        bestLift,
        bestDetail,
      },
    ];
  });

  const trainedRows = await sql`
    SELECT finished_at
    FROM workout_sessions
    WHERE user_id = ${userId}
      AND finished_at >= now() - interval '16 weeks'
  `;

  const now = new Date();
  const trainedDayKeys = new Set<string>();
  const trainedWeekKeys = new Set<string>();
  const thisWeekKey = dateKey(startOfWeek(now));
  let completedThisWeek = 0;

  for (const row of trainedRows) {
    const finishedAt = row.finished_at;
    const finishedDate =
      finishedAt instanceof Date ? finishedAt : new Date(String(finishedAt));

    if (Number.isNaN(finishedDate.getTime())) continue;

    const zoned = zonedDateParts(finishedDate);
    trainedDayKeys.add(dateKey(zoned));
    const weekKey = dateKey(startOfWeek(finishedDate));
    trainedWeekKeys.add(weekKey);
    if (weekKey === thisWeekKey) completedThisWeek += 1;
  }

  return {
    routine: {
      id: routineId,
      name: readString(routineRow?.name) ?? DEFAULT_ROUTINE.name,
      dayLabel: readString(routineRow?.day_label) ?? DEFAULT_ROUTINE.dayLabel,
      estimatedMinutes: readNumber(routineRow?.estimated_minutes) || 45,
      exercises,
    },
    history,
    week: buildWeek(now, trainedDayKeys),
    completedThisWeek,
    streakWeeks: countStreakWeeks(now, trainedWeekKeys),
    todayLabel: formatTodayLabel(now),
  };
}

export async function saveFinishedWorkout(
  userId: string,
  input: unknown,
): Promise<SaveWorkoutResult> {
  const parsed = finishedWorkoutSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "No se pudo leer el entrenamiento." };
  }

  const elapsedWall = Math.floor((Date.now() - parsed.data.startedAt) / 1000);

  if (parsed.data.elapsedSeconds > elapsedWall + 5) {
    return { ok: false, message: "El tiempo del entrenamiento no es válido." };
  }

  try {
    await ensureAuthSchema();
    const sql = getDb();
    const routines = await sql`
      SELECT id, name
      FROM routines
      WHERE id = ${parsed.data.routineId}
        AND user_id = ${userId}
      LIMIT 1
    `;
    const routineName = readString(routines[0]?.name);

    if (!routineName) {
      return { ok: false, message: "Esa rutina no pertenece a tu cuenta." };
    }

    let volumeKg = 0;
    let setCount = 0;
    let bestWeight = -1;
    let bestLift = "Sin marca";
    let bestDetail = "Sin series completadas";

    for (const exercise of parsed.data.exercises) {
      let lastDone: { weight: string; reps: string } | null = null;

      for (const set of exercise.sets) {
        if (set.status !== "done") continue;

        const weight = parseWeight(set.weight);
        const reps = parseWeight(set.reps);
        volumeKg += weight * reps;
        setCount += 1;
        lastDone = { weight: set.weight, reps: set.reps };

        if (weight > bestWeight) {
          bestWeight = weight;
          bestLift = exercise.name;
          bestDetail = `${set.weight} kg × ${set.reps} reps`;
        }
      }

      if (lastDone) {
        await sql`
          UPDATE routine_exercises
          SET last_weight = ${lastDone.weight}, last_reps = ${lastDone.reps}
          WHERE routine_id = ${parsed.data.routineId}
            AND name = ${exercise.name}
        `;
      }
    }

    await sql`
      INSERT INTO workout_sessions (
        id,
        user_id,
        routine_id,
        routine_name,
        started_at,
        finished_at,
        elapsed_seconds,
        volume_kg,
        set_count,
        best_lift,
        best_detail
      )
      VALUES (
        ${randomUUID()},
        ${userId},
        ${parsed.data.routineId},
        ${routineName},
        ${new Date(parsed.data.startedAt).toISOString()},
        ${new Date().toISOString()},
        ${parsed.data.elapsedSeconds},
        ${volumeKg},
        ${setCount},
        ${bestLift},
        ${bestDetail}
      )
    `;
  } catch (error) {
    console.error("Failed to save workout session", error);
    return {
      ok: false,
      message: "No se pudo guardar el entrenamiento. Inténtalo de nuevo.",
    };
  }

  return { ok: true };
}
