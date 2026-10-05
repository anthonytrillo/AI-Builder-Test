import type {
  RoutineExerciseTemplate,
  RoutineTemplate,
} from "@/lib/workout-home";

export type WorkoutSetStatus = "done" | "active" | "pending";

export type WorkoutSet = {
  id: number;
  weight: string;
  reps: string;
  status: WorkoutSetStatus;
};

export type WorkoutExercise = {
  name: string;
  lastPerformance: string | null;
  sets: WorkoutSet[];
};

export type ActiveWorkout = {
  routineId: string;
  routineName: string;
  dayLabel: string;
  exerciseIndex: number;
  exercises: WorkoutExercise[];
  elapsedSeconds: number;
  resumedAt: number | null;
  restSeconds: number;
  restResumedAt: number | null;
  open: boolean;
  startedAt: number;
};

export const DEFAULT_REST_SECONDS = 90;

const STORAGE_PREFIX = "gym-tracker.active-workout";
const listeners = new Set<() => void>();

type Cache = {
  userId: string;
  raw: string | null;
  value: ActiveWorkout | null;
};

let cache: Cache | null = null;

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}.${userId}`;
}

function isWorkoutSet(value: unknown): value is WorkoutSet {
  if (!value || typeof value !== "object") return false;

  const set = value as WorkoutSet;

  return (
    typeof set.id === "number" &&
    typeof set.weight === "string" &&
    typeof set.reps === "string" &&
    (set.status === "done" ||
      set.status === "active" ||
      set.status === "pending")
  );
}

function isWorkoutExercise(value: unknown): value is WorkoutExercise {
  if (!value || typeof value !== "object") return false;

  const exercise = value as WorkoutExercise;

  return (
    typeof exercise.name === "string" &&
    (exercise.lastPerformance === null ||
      typeof exercise.lastPerformance === "string") &&
    Array.isArray(exercise.sets) &&
    exercise.sets.every(isWorkoutSet)
  );
}

function isActiveWorkout(value: unknown): value is ActiveWorkout {
  if (!value || typeof value !== "object") return false;

  const workout = value as ActiveWorkout;

  return (
    typeof workout.routineId === "string" &&
    typeof workout.routineName === "string" &&
    typeof workout.dayLabel === "string" &&
    typeof workout.exerciseIndex === "number" &&
    typeof workout.elapsedSeconds === "number" &&
    (workout.resumedAt === null || typeof workout.resumedAt === "number") &&
    typeof workout.restSeconds === "number" &&
    (workout.restResumedAt === null ||
      typeof workout.restResumedAt === "number") &&
    typeof workout.open === "boolean" &&
    typeof workout.startedAt === "number" &&
    Array.isArray(workout.exercises) &&
    workout.exercises.every(isWorkoutExercise)
  );
}

function parseActiveWorkout(raw: string | null): ActiveWorkout | null {
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    return isActiveWorkout(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function subscribeActiveWorkout(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

export function getActiveWorkoutSnapshot(userId: string): ActiveWorkout | null {
  if (typeof window === "undefined") return null;

  const raw = window.sessionStorage.getItem(storageKey(userId));

  if (cache?.userId === userId && cache.raw === raw) return cache.value;

  const value = parseActiveWorkout(raw);
  cache = { userId, raw, value };
  return value;
}

export function getServerActiveWorkoutSnapshot(): ActiveWorkout | null {
  return null;
}

export function writeActiveWorkout(
  userId: string,
  workout: ActiveWorkout | null,
) {
  if (typeof window === "undefined") return;

  const key = storageKey(userId);

  if (!workout) window.sessionStorage.removeItem(key);
  else window.sessionStorage.setItem(key, JSON.stringify(workout));

  cache = null;

  for (const listener of listeners) listener();
}

export function elapsedSeconds(workout: ActiveWorkout, now: number) {
  if (workout.resumedAt == null || now === 0) return workout.elapsedSeconds;

  const delta = Math.floor((now - workout.resumedAt) / 1000);

  return workout.elapsedSeconds + Math.max(0, delta);
}

export function restSeconds(workout: ActiveWorkout, now: number) {
  if (workout.restResumedAt == null || now === 0) return workout.restSeconds;

  const spent = Math.floor((now - workout.restResumedAt) / 1000);

  return Math.max(0, workout.restSeconds - Math.max(0, spent));
}

export function freezeWorkout(
  workout: ActiveWorkout,
  now: number,
): ActiveWorkout {
  return {
    ...workout,
    elapsedSeconds: elapsedSeconds(workout, now),
    resumedAt: null,
    restSeconds: restSeconds(workout, now),
    restResumedAt: null,
  };
}

export function resumeWorkout(
  workout: ActiveWorkout,
  now: number,
): ActiveWorkout {
  const frozen = freezeWorkout(workout, now);

  return {
    ...frozen,
    resumedAt: now,
    restResumedAt: frozen.restSeconds > 0 ? now : null,
    open: true,
  };
}

export function openWorkout(workout: ActiveWorkout): ActiveWorkout {
  return { ...workout, open: true };
}

function cloneExercises(exercises: WorkoutExercise[]) {
  return exercises.map((exercise) => ({
    ...exercise,
    sets: exercise.sets.map((set) => ({ ...set })),
  }));
}

function toWorkoutSets(exercise: RoutineExerciseTemplate, active: boolean) {
  return exercise.sets.map((set, index) => ({
    id: index + 1,
    weight: set.weight,
    reps: set.reps,
    status: active && index === 0 ? "active" : "pending",
  })) satisfies WorkoutSet[];
}

export function createWorkout(
  routine: RoutineTemplate,
  now: number,
): ActiveWorkout {
  return {
    routineId: routine.id,
    routineName: routine.name,
    dayLabel: routine.dayLabel,
    exerciseIndex: 0,
    exercises: routine.exercises.map((exercise, index) => ({
      name: exercise.name,
      lastPerformance: exercise.lastPerformance,
      sets: toWorkoutSets(exercise, index === 0),
    })),
    elapsedSeconds: 0,
    resumedAt: now,
    restSeconds: 0,
    restResumedAt: null,
    open: true,
    startedAt: now,
  };
}

export function updateActiveSet(
  workout: ActiveWorkout,
  setId: number,
  field: "weight" | "reps",
  value: string,
): ActiveWorkout {
  const exercises = cloneExercises(workout.exercises);
  const exercise = exercises[workout.exerciseIndex];

  if (!exercise) return workout;

  exercise.sets = exercise.sets.map((set) =>
    set.id === setId && set.status === "active"
      ? { ...set, [field]: value }
      : set,
  );

  return { ...workout, exercises };
}

export function completeActiveSet(
  workout: ActiveWorkout,
  now: number,
): ActiveWorkout {
  const exercises = cloneExercises(workout.exercises);
  let exerciseIndex = workout.exerciseIndex;
  const exercise = exercises[exerciseIndex];

  if (!exercise) return workout;

  const activeIndex = exercise.sets.findIndex((set) => set.status === "active");
  const activeSet = exercise.sets[activeIndex];

  if (!activeSet) return workout;

  exercise.sets[activeIndex] = { ...activeSet, status: "done" };

  const nextIndex = exercise.sets.findIndex(
    (set, index) => index > activeIndex && set.status === "pending",
  );
  const nextSet = exercise.sets[nextIndex];

  if (nextSet) {
    exercise.sets[nextIndex] = { ...nextSet, status: "active" };
  } else if (exerciseIndex < exercises.length - 1) {
    exerciseIndex += 1;
    const upcoming = exercises[exerciseIndex];
    const firstPending = upcoming?.sets.findIndex(
      (set) => set.status === "pending",
    );
    const pendingSet =
      upcoming && firstPending != null
        ? upcoming.sets[firstPending]
        : undefined;

    if (upcoming && pendingSet && firstPending != null) {
      upcoming.sets[firstPending] = { ...pendingSet, status: "active" };
    }
  }

  return {
    ...workout,
    exercises,
    exerciseIndex,
    restSeconds: DEFAULT_REST_SECONDS,
    restResumedAt: now,
  };
}

export function addSet(workout: ActiveWorkout): ActiveWorkout {
  const exercises = cloneExercises(workout.exercises);
  const exercise = exercises[workout.exerciseIndex];

  if (!exercise) return workout;

  const last = exercise.sets[exercise.sets.length - 1];
  const hasActive = exercise.sets.some((set) => set.status === "active");

  exercise.sets.push({
    id: exercise.sets.length + 1,
    weight: last?.weight ?? "0",
    reps: last?.reps ?? "8",
    status: hasActive ? "pending" : "active",
  });

  return { ...workout, exercises };
}

export function extendRest(workout: ActiveWorkout, now: number): ActiveWorkout {
  return {
    ...workout,
    restSeconds: restSeconds(workout, now) + 30,
    restResumedAt: now,
  };
}

export function skipRest(workout: ActiveWorkout): ActiveWorkout {
  return { ...workout, restSeconds: 0, restResumedAt: null };
}
