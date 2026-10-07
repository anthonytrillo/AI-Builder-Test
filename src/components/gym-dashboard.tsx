"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  CircleUserRound,
  Clock3,
  Dumbbell,
  Flame,
  Pause,
  Play,
  Plus,
  SkipForward,
  Sparkles,
  TimerReset,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { logoutAccount } from "@/app/actions/auth";
import { requestSessionCoach } from "@/app/actions/coach";
import { saveFinishedWorkout } from "@/app/actions/workouts";
import {
  addSet,
  completeActiveSet,
  createWorkout,
  elapsedSeconds,
  extendRest,
  freezeWorkout,
  getActiveWorkoutSnapshot,
  getServerActiveWorkoutSnapshot,
  openWorkout,
  restSeconds,
  resumeWorkout,
  skipRest,
  subscribeActiveWorkout,
  updateActiveSet,
  writeActiveWorkout,
  type ActiveWorkout,
} from "@/lib/active-workout";
import { AUTH_SESSION_EVENT, type AuthSession } from "@/lib/auth-session";
import type { CoachAdvice } from "@/lib/coach-result";
import type { WorkoutHistoryEntry, WorkoutHome } from "@/lib/workout-home";

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${(seconds % 60).toString().padStart(2, "0")}`;
}

function formatVolume(kg: number) {
  return new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 0,
  }).format(kg);
}

function exerciseCountLabel(count: number) {
  return count === 1 ? "1 ejercicio" : `${count} ejercicios`;
}

function streakLabel(weeks: number) {
  return weeks === 1 ? "1 semana" : `${weeks} semanas`;
}

function sessionCountLabel(count: number) {
  return count === 1
    ? "1 entrenamiento completado"
    : `${count} entrenamientos completados`;
}

function setCountLabel(count: number) {
  return count === 1 ? "1 serie" : `${count} series`;
}

function SessionStats({ entry }: { entry: WorkoutHistoryEntry }) {
  return (
    <div className="mt-6 grid grid-cols-3 divide-x divide-zinc-800">
      <div className="pr-3">
        <p className="text-xs text-zinc-500">Volumen</p>
        <p className="mt-2 text-lg font-semibold">
          {formatVolume(entry.volumeKg)}{" "}
          <span className="text-xs font-normal text-zinc-500">kg</span>
        </p>
      </div>
      <div className="px-3">
        <p className="text-xs text-zinc-500">Total sets</p>
        <p className="mt-2 text-lg font-semibold">
          {entry.setCount}{" "}
          <span className="text-xs font-normal text-zinc-500">
            {entry.setCount === 1 ? "serie" : "series"}
          </span>
        </p>
      </div>
      <div className="pl-3">
        <p className="text-xs text-zinc-500">Mejor levantamiento</p>
        <p className="mt-2 text-sm font-semibold">{entry.bestLift}</p>
        <p className="text-xs text-emerald-400">{entry.bestDetail}</p>
      </div>
    </div>
  );
}

export function GymDashboard({
  session,
  workoutHome,
}: {
  session: AuthSession;
  workoutHome: WorkoutHome;
}) {
  const router = useRouter();
  const workout = useSyncExternalStore(
    subscribeActiveWorkout,
    () => getActiveWorkoutSnapshot(session.userId),
    getServerActiveWorkoutSnapshot,
  );
  const [now, setNow] = useState(0);
  const [confirmingFinish, setConfirmingFinish] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [coachAdvice, setCoachAdvice] = useState<CoachAdvice | null>(null);
  const [coachError, setCoachError] = useState<string | null>(null);
  const [coachLoading, setCoachLoading] = useState(false);
  const shouldTick = Boolean(workout?.resumedAt || workout?.restResumedAt);

  useEffect(() => {
    if (!shouldTick) return;

    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, [shouldTick]);

  const greetingName = session.fullName.split(" ").find(Boolean) ?? "atleta";
  const latestSession = workoutHome.history[0] ?? null;

  function updateWorkout(
    updater: (current: ActiveWorkout | null) => ActiveWorkout | null,
  ) {
    const timestamp = Date.now();
    setNow(timestamp);
    writeActiveWorkout(
      session.userId,
      updater(getActiveWorkoutSnapshot(session.userId)),
    );
  }

  function leaveWorkout() {
    setConfirmingFinish(false);
    updateWorkout((current) =>
      current ? { ...current, open: false } : current,
    );
  }

  function startOrContinue() {
    const timestamp = Date.now();
    updateWorkout((current) => {
      if (!current) return createWorkout(workoutHome.routine, timestamp);
      if (current.resumedAt) return openWorkout(current);
      return resumeWorkout(current, timestamp);
    });
  }

  function togglePause() {
    updateWorkout((current) => {
      if (!current) return current;
      const timestamp = Date.now();
      if (current.resumedAt) {
        return { ...freezeWorkout(current, timestamp), open: true };
      }
      return resumeWorkout(current, timestamp);
    });
  }

  async function confirmFinish() {
    if (!workout || saving) return;

    setSaving(true);
    setSaveError(null);

    const result = await saveFinishedWorkout({
      routineId: workout.routineId,
      startedAt: workout.startedAt,
      elapsedSeconds: elapsedSeconds(workout, Date.now()),
      exercises: workout.exercises.map((exercise) => ({
        name: exercise.name,
        sets: exercise.sets,
      })),
    });

    if (!result.ok) {
      setSaveError(result.message);
      setSaving(false);
      return;
    }

    updateWorkout(() => null);
    setConfirmingFinish(false);
    setSaving(false);
    router.refresh();
  }

  async function askCoach() {
    if (coachLoading) return;

    setCoachLoading(true);
    setCoachError(null);

    const result = await requestSessionCoach();

    if (!result.ok) {
      setCoachError(result.message);
      setCoachLoading(false);
      return;
    }

    setCoachAdvice(result.advice);
    setCoachLoading(false);
  }

  if (workout?.open) {
    const elapsed = elapsedSeconds(workout, now);
    const rest = restSeconds(workout, now);
    const exercise = workout.exercises[workout.exerciseIndex];
    const sets = exercise?.sets ?? [];
    const completedSets = sets.filter((set) => set.status === "done").length;
    const paused = workout.resumedAt == null;
    const resting = workout.restResumedAt != null || rest > 0;

    return (
      <main className="min-h-screen bg-zinc-950 px-4 pb-32 pt-5 text-zinc-50 sm:px-8">
        <div className="mx-auto w-full max-w-3xl">
          <header className="flex items-start justify-between gap-4 border-b border-zinc-800 pb-5">
            <div className="flex items-start gap-3">
              <button
                type="button"
                aria-label="Volver al inicio"
                onClick={leaveWorkout}
                className="mt-1 rounded-xl border border-zinc-800 p-2 text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-100"
              >
                <ArrowLeft className="size-5" />
              </button>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
                  Entrenamiento en curso
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                  {workout.routineName}
                </h1>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-500">Tiempo</p>
              <p className="mt-1 flex items-center gap-1.5 font-mono text-lg font-semibold text-zinc-100">
                <Clock3 className="size-4 text-emerald-400" />{" "}
                {formatTime(elapsed)}
              </p>
            </div>
          </header>

          <section className="mt-6 rounded-3xl border border-emerald-500/30 bg-zinc-900 p-5 shadow-[0_20px_70px_-35px_rgba(16,185,129,0.45)] sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
                  Ejercicio actual ·{" "}
                  {String(workout.exerciseIndex + 1).padStart(2, "0")} /{" "}
                  {String(workout.exercises.length).padStart(2, "0")}
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                  {exercise?.name ?? "Ejercicio"}
                </h2>
                <p className="mt-2 text-sm text-zinc-400">
                  {exercise?.lastPerformance ? (
                    <>
                      Última vez:{" "}
                      <span className="font-medium text-zinc-200">
                        {exercise.lastPerformance}
                      </span>
                    </>
                  ) : (
                    "Sin registro anterior"
                  )}
                </p>
              </div>
              <button
                type="button"
                aria-label={
                  paused ? "Reanudar entrenamiento" : "Pausar entrenamiento"
                }
                onClick={togglePause}
                className="rounded-xl border border-zinc-700 p-2.5 text-zinc-400 hover:text-zinc-100"
              >
                {paused ? (
                  <Play className="size-4 fill-current" />
                ) : (
                  <Pause className="size-4" />
                )}
              </button>
            </div>

            <div className="mt-7 overflow-hidden rounded-2xl border border-zinc-800">
              <div className="grid grid-cols-[0.8fr_1fr_1fr_1.1fr] items-center bg-zinc-950 px-3 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 sm:px-5">
                <span>Serie</span>
                <span>Kg</span>
                <span>Reps</span>
                <span className="text-right">Estado</span>
              </div>
              {sets.map((set) => {
                const done = set.status === "done";
                const active = set.status === "active";
                return (
                  <div
                    key={set.id}
                    className={`grid grid-cols-[0.8fr_1fr_1fr_1.1fr] items-center gap-2 border-t border-zinc-800 px-3 py-4 sm:px-5 ${!active && !done ? "opacity-45" : ""}`}
                  >
                    <span className="text-sm font-semibold text-zinc-300">
                      Serie {set.id}
                    </span>
                    <input
                      aria-label={`Peso serie ${set.id}`}
                      type="number"
                      value={set.weight}
                      disabled={!active}
                      onChange={(event) =>
                        updateWorkout((current) =>
                          current
                            ? updateActiveSet(
                                current,
                                set.id,
                                "weight",
                                event.target.value,
                              )
                            : current,
                        )
                      }
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-3 text-lg font-semibold text-zinc-100 outline-none transition focus:border-emerald-400 disabled:cursor-default disabled:border-transparent disabled:bg-transparent sm:max-w-24"
                    />
                    <input
                      aria-label={`Repeticiones serie ${set.id}`}
                      type="number"
                      value={set.reps}
                      disabled={!active}
                      onChange={(event) =>
                        updateWorkout((current) =>
                          current
                            ? updateActiveSet(
                                current,
                                set.id,
                                "reps",
                                event.target.value,
                              )
                            : current,
                        )
                      }
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-3 text-lg font-semibold text-zinc-100 outline-none transition focus:border-emerald-400 disabled:cursor-default disabled:border-transparent disabled:bg-transparent sm:max-w-24"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        disabled={!active}
                        onClick={() =>
                          updateWorkout((current) =>
                            current
                              ? completeActiveSet(current, Date.now())
                              : current,
                          )
                        }
                        className={`inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition disabled:cursor-default ${done ? "bg-emerald-400 text-zinc-950" : active ? "border border-emerald-500 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500 hover:text-zinc-950" : "border border-zinc-800 text-zinc-500"}`}
                      >
                        {done ? (
                          <Check className="size-4" />
                        ) : active ? (
                          <>
                            <Check className="size-4" />{" "}
                            <span className="hidden sm:inline">
                              Completar Serie
                            </span>
                            <span className="sm:hidden">Completar</span>
                          </>
                        ) : (
                          <span>Pendiente</span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() =>
                updateWorkout((current) =>
                  current ? addSet(current) : current,
                )
              }
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-emerald-400"
            >
              <Plus className="size-4" /> Agregar Serie
            </button>
          </section>

          <div className="mt-5 flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-3 text-sm">
            <span className="text-zinc-400">
              <span className="font-semibold text-zinc-100">
                {completedSets} / {sets.length}
              </span>{" "}
              series completadas
            </span>
            <span className="text-emerald-400">
              {workout.exerciseIndex + 1} de {workout.exercises.length}
            </span>
          </div>

          <div className="fixed inset-x-4 bottom-4 z-20 mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-zinc-900/95 px-4 py-3 shadow-2xl backdrop-blur sm:px-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-400/10 p-2 text-amber-400">
                <TimerReset className="size-5" />
              </div>
              <div>
                <p className="text-xs text-zinc-500">
                  Temporizador de descanso
                </p>
                <p className="font-mono text-lg font-bold text-zinc-100">
                  Descanso: {formatTime(rest)}
                </p>
                {resting ? null : (
                  <p className="text-xs text-zinc-500">
                    Se activa al completar una serie
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  updateWorkout((current) =>
                    current ? extendRest(current, Date.now()) : current,
                  )
                }
                className="hidden rounded-lg border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-300 hover:border-amber-400 hover:text-amber-300 sm:block"
              >
                +60s
              </button>
              <button
                type="button"
                onClick={() =>
                  updateWorkout((current) =>
                    current ? skipRest(current) : current,
                  )
                }
                aria-label="Saltear descanso"
                className="rounded-lg border border-zinc-700 p-2 text-zinc-400 hover:text-zinc-100"
              >
                <SkipForward className="size-4" />
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setSaveError(null);
              setConfirmingFinish(true);
            }}
            className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-red-400"
          >
            <X className="size-4" /> Finalizar Entrenamiento
          </button>
        </div>

        {confirmingFinish ? (
          <div className="fixed inset-0 z-30 flex items-end justify-center bg-zinc-950/70 p-4 sm:items-center">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="finish-workout-title"
              className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl"
            >
              <h2
                id="finish-workout-title"
                className="text-xl font-semibold text-zinc-50"
              >
                ¿Finalizar entrenamiento?
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                El tiempo y las series completadas se guardan en el historial de
                tu cuenta.
              </p>
              {saveError ? (
                <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  {saveError}
                </p>
              ) : null}
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setConfirmingFinish(false)}
                  className="inline-flex h-12 flex-1 items-center justify-center rounded-xl border border-zinc-700 px-5 font-semibold text-zinc-100 hover:border-zinc-500 disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void confirmFinish()}
                  className="inline-flex h-12 flex-1 items-center justify-center rounded-xl bg-emerald-400 px-5 font-semibold text-zinc-950 hover:bg-emerald-300 disabled:opacity-60"
                >
                  {saving ? "Guardando..." : "Guardar y finalizar"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    );
  }

  const liveElapsed = workout ? elapsedSeconds(workout, now) : 0;

  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-28 pt-7 sm:px-8 lg:pb-10">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-emerald-400">
            {workoutHome.todayLabel}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
            ¡Hola, {greetingName}!
          </h1>
          <p className="mt-1 text-sm leading-6 text-zinc-400">
            Sesión iniciada
          </p>
          <button
            type="button"
            onClick={() => {
              void logoutAccount().finally(() => {
                window.dispatchEvent(new Event(AUTH_SESSION_EVENT));
                router.refresh();
              });
            }}
            className="mt-2 text-xs font-semibold text-zinc-500 hover:text-zinc-200"
          >
            Cerrar sesión
          </button>
        </div>
        <Link
          href="/login"
          aria-label="Cuenta"
          className="rounded-full border border-zinc-700 bg-zinc-900 p-2 text-zinc-300 hover:border-emerald-400 hover:text-emerald-400"
        >
          <CircleUserRound className="size-6" />
        </Link>
      </header>
      <div className="mt-8 grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <section className="rounded-3xl border border-emerald-500/25 bg-zinc-900 p-6 shadow-[0_20px_60px_-30px_rgba(16,185,129,0.4)] sm:p-8">
          <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-400">
            Entrenamiento de hoy de la semana
          </span>
          <p className="mt-8 text-sm text-zinc-400">
            {workout?.dayLabel ?? workoutHome.routine.dayLabel}
          </p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight text-zinc-50">
            {workout?.routineName ?? workoutHome.routine.name}
          </h2>
          <div className="mt-4 flex gap-5 text-sm text-zinc-400">
            <span>
              {exerciseCountLabel(workoutHome.routine.exercises.length)}
            </span>
            <span>~{workoutHome.routine.estimatedMinutes} min</span>
          </div>
          <button
            type="button"
            onClick={startOrContinue}
            className="relative z-20 mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 font-semibold text-zinc-950 hover:bg-emerald-300 sm:w-auto"
          >
            <Play className="size-4 fill-current" />{" "}
            {workout ? "Continuar entrenamiento" : "Iniciar entrenamiento"}
          </button>
          {workout ? (
            <p className="mt-3 text-sm text-zinc-400">
              En curso · {formatTime(liveElapsed)}
            </p>
          ) : null}
        </section>
        <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Tu semana</p>
              <h2 className="mt-1 text-xl font-semibold text-zinc-50">
                Progreso semanal
              </h2>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-400">
              <Flame className="size-3.5 fill-current" />{" "}
              {streakLabel(workoutHome.streakWeeks)}
            </span>
          </div>
          <div className="mt-7 grid grid-cols-7 gap-2">
            {workoutHome.week.map((item) => (
              <div
                key={`${item.day}-${item.date}`}
                className="flex flex-col items-center gap-2"
              >
                <span className="text-xs font-medium text-zinc-500">
                  {item.day}
                </span>
                <div
                  className={`flex size-9 items-center justify-center rounded-full text-xs font-semibold ${item.done ? "bg-emerald-400 text-zinc-950" : item.isToday ? "border-2 border-emerald-400 text-emerald-400" : "bg-zinc-800 text-zinc-500"}`}
                >
                  {item.done ? <Check className="size-4" /> : item.date}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-zinc-500">
            <span className="text-emerald-400">●</span>{" "}
            {sessionCountLabel(workoutHome.completedThisWeek)}
          </p>
        </section>
      </div>
      <section className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        {latestSession ? (
          <>
            <div>
              <p className="text-sm text-zinc-400">Última sesión</p>
              <h2 className="mt-1 text-xl font-semibold text-zinc-50">
                {latestSession.routineName}
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                {latestSession.finishedLabel} ·{" "}
                {formatTime(latestSession.elapsedSeconds)}
              </p>
            </div>
            <SessionStats entry={latestSession} />
            <button
              type="button"
              disabled={coachLoading}
              onClick={() => void askCoach()}
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-400 disabled:opacity-60"
            >
              <Sparkles className="size-4" />
              {coachLoading ? "Pensando..." : "Pedir consejo"}
            </button>
            {coachError ? (
              <p className="mt-3 text-sm text-red-300">{coachError}</p>
            ) : null}
            {coachAdvice ? (
              <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <p className="text-sm leading-6 text-zinc-200">
                  {coachAdvice.summary}
                </p>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-zinc-300">
                  {coachAdvice.tips.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {workoutHome.history.length > 1 ? (
              <button
                type="button"
                onClick={() => setShowHistory((current) => !current)}
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-400"
              >
                {showHistory ? "Ocultar historial" : "Ver historial completo"}{" "}
                <ChevronRight className="size-4" />
              </button>
            ) : null}
            {showHistory ? (
              <ul className="mt-4 divide-y divide-zinc-800">
                {workoutHome.history.map((entry) => (
                  <li key={entry.id} className="py-4">
                    <p className="font-semibold text-zinc-100">
                      {entry.routineName}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {entry.finishedLabel} · {formatTime(entry.elapsedSeconds)}{" "}
                      · {formatVolume(entry.volumeKg)} kg ·{" "}
                      {setCountLabel(entry.setCount)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        ) : (
          <div>
            <p className="text-sm text-zinc-400">Última sesión</p>
            <h2 className="mt-1 text-xl font-semibold text-zinc-50">
              Todavía no hay sesiones
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Cuando finalices un entrenamiento, el tiempo y las series quedan
              guardados en tu cuenta.
            </p>
          </div>
        )}
      </section>
      <section className="mt-8">
        <div>
          <p className="text-sm text-zinc-400">Tus rutinas</p>
          <h2 className="mt-1 text-xl font-semibold text-zinc-50">
            Acceso rápido
          </h2>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={startOrContinue}
            className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-left hover:border-zinc-700"
          >
            <Dumbbell className="size-4 rounded-lg bg-emerald-500/10 p-2 text-emerald-400 box-content" />
            <p className="mt-5 font-semibold text-zinc-100">
              {workoutHome.routine.name}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {exerciseCountLabel(workoutHome.routine.exercises.length)}
            </p>
          </button>
        </div>
      </section>
      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-4 bottom-4 z-10 mx-auto flex max-w-md items-center justify-around rounded-2xl border border-zinc-800 bg-zinc-900/95 p-2 shadow-2xl backdrop-blur lg:static lg:mt-10 lg:max-w-none lg:justify-start lg:gap-8 lg:rounded-none lg:border-x-0 lg:border-b-0 lg:bg-transparent lg:p-0 lg:shadow-none"
      >
        <button className="flex min-w-16 flex-col items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-medium text-emerald-400">
          <Dumbbell className="size-5" />
          <span>Inicio</span>
        </button>
        <Link
          href="/login"
          className="flex min-w-16 flex-col items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-medium text-zinc-500"
        >
          <UserRound className="size-5" />
          <span>Cuenta</span>
        </Link>
      </nav>
    </main>
  );
}
