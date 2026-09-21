"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  CircleUserRound,
  Clock3,
  Dumbbell,
  Flame,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  SkipForward,
  TimerReset,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { logoutAccount } from "@/app/actions/auth";
import { useAuthSession } from "@/hooks/use-auth-session";
import { AUTH_SESSION_EVENT, type AuthSession } from "@/lib/auth-session";

const initialSets = [
  { id: 1, weight: "80", reps: "10", status: "done" },
  { id: 2, weight: "82.5", reps: "8", status: "active" },
  { id: 3, weight: "82.5", reps: "8", status: "pending" },
];

const week = [
  { day: "L", date: "14", done: false },
  { day: "M", date: "15", done: true },
  { day: "X", date: "16", done: true },
  { day: "J", date: "17", done: false },
  { day: "V", date: "18", done: true },
  { day: "S", date: "19", done: false },
  { day: "D", date: "20", done: false },
];

const routines = [
  ["Rutina A", "Torso", "6 ejercicios", "bg-cyan-500/10 text-cyan-400"],
  ["Rutina B", "Pierna", "5 ejercicios", "bg-emerald-500/10 text-emerald-400"],
  ["Rutina C", "Fullbody", "7 ejercicios", "bg-amber-500/10 text-amber-400"],
];

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${(seconds % 60).toString().padStart(2, "0")}`;
}

export function GymDashboard({
  initialSession = null,
}: {
  initialSession?: AuthSession | null;
}) {
  const session = useAuthSession(initialSession);
  const [started, setStarted] = useState(false);
  const [elapsed, setElapsed] = useState(24 * 60 + 15);
  const [rest, setRest] = useState(90);
  const [sets, setSets] = useState(initialSets);

  useEffect(() => {
    if (!started) return;
    const interval = window.setInterval(
      () => setElapsed((value) => value + 1),
      1000,
    );
    return () => window.clearInterval(interval);
  }, [started]);

  useEffect(() => {
    if (!started || rest <= 0) return;
    const interval = window.setInterval(
      () => setRest((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => window.clearInterval(interval);
  }, [started, rest]);

  const completedSets = useMemo(
    () => sets.filter((set) => set.status === "done").length,
    [sets],
  );
  const greetingName = session?.fullName.split(" ").find(Boolean) ?? "Alex";

  if (started) {
    return (
      <main className="min-h-screen bg-zinc-950 px-4 pb-32 pt-5 text-zinc-50 sm:px-8">
        <div className="mx-auto w-full max-w-3xl">
          <header className="flex items-start justify-between gap-4 border-b border-zinc-800 pb-5">
            <div className="flex items-start gap-3">
              <button
                aria-label="Volver al inicio"
                onClick={() => setStarted(false)}
                className="mt-1 rounded-xl border border-zinc-800 p-2 text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-100"
              >
                <ArrowLeft className="size-5" />
              </button>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
                  Entrenamiento en curso
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                  Pecho y Tríceps
                </h1>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-500">Tiempo</p>
              <p className="mt-1 flex items-center gap-1.5 font-mono text-lg font-semibold text-zinc-100">
                <Clock3 className="size-4 text-emerald-400" />{" "}
                {formatTime(elapsed)} min
              </p>
            </div>
          </header>

          <section className="mt-6 rounded-3xl border border-emerald-500/30 bg-zinc-900 p-5 shadow-[0_20px_70px_-35px_rgba(16,185,129,0.45)] sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
                  Ejercicio actual · 01 / 05
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                  Press de banca plano
                </h2>
                <p className="mt-2 text-sm text-zinc-400">
                  Última vez:{" "}
                  <span className="font-medium text-zinc-200">
                    80kg × 8 reps
                  </span>
                </p>
              </div>
              <button
                aria-label="Pausar entrenamiento"
                className="rounded-xl border border-zinc-700 p-2.5 text-zinc-400 hover:text-zinc-100"
              >
                <Pause className="size-4" />
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
                        setSets((items) =>
                          items.map((item) =>
                            item.id === set.id
                              ? { ...item, weight: event.target.value }
                              : item,
                          ),
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
                        setSets((items) =>
                          items.map((item) =>
                            item.id === set.id
                              ? { ...item, reps: event.target.value }
                              : item,
                          ),
                        )
                      }
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-3 text-lg font-semibold text-zinc-100 outline-none transition focus:border-emerald-400 disabled:cursor-default disabled:border-transparent disabled:bg-transparent sm:max-w-24"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={() =>
                          setSets((items) =>
                            items.map((item) =>
                              item.id === set.id
                                ? { ...item, status: done ? "active" : "done" }
                                : item,
                            ),
                          )
                        }
                        className={`inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition ${done ? "bg-emerald-400 text-zinc-950" : active ? "border border-emerald-500 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500 hover:text-zinc-950" : "border border-zinc-800 text-zinc-500"}`}
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
              onClick={() =>
                setSets((items) => [
                  ...items,
                  {
                    id: items.length + 1,
                    weight: "82.5",
                    reps: "8",
                    status: "pending",
                  },
                ])
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
            <span className="text-emerald-400">Buen ritmo</span>
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
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRest((value) => value + 30)}
                className="hidden rounded-lg border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-300 hover:border-amber-400 hover:text-amber-300 sm:block"
              >
                +30s
              </button>
              <button
                onClick={() => setRest(0)}
                aria-label="Saltear descanso"
                className="rounded-lg border border-zinc-700 p-2 text-zinc-400 hover:text-zinc-100"
              >
                <SkipForward className="size-4" />
              </button>
            </div>
          </div>

          <button
            onClick={() => setStarted(false)}
            className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-red-400"
          >
            <X className="size-4" /> Finalizar Entrenamiento
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-28 pt-7 sm:px-8 lg:pb-10">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-emerald-400">
            LUNES, 14 DE OCTUBRE
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
            ¡Hola, {greetingName}!
          </h1>
          <p className="mt-1 text-sm leading-6 text-zinc-400">
            {session ? "Sesión iniciada" : "Listo para entrenar hoy"}
          </p>
          {session ? (
            <button
              type="button"
              onClick={() => {
                void logoutAccount().finally(() => {
                  window.dispatchEvent(new Event(AUTH_SESSION_EVENT));
                });
              }}
              className="mt-2 text-xs font-semibold text-zinc-500 hover:text-zinc-200"
            >
              Cerrar sesión
            </button>
          ) : null}
        </div>
        <Link
          href="/login"
          aria-label={session ? "Cuenta" : "Iniciar sesión"}
          className="rounded-full border border-zinc-700 bg-zinc-900 p-2 text-zinc-300 hover:border-emerald-400 hover:text-emerald-400"
        >
          <CircleUserRound className="size-6" />
        </Link>
      </header>
      <div className="mt-8 grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <section className="rounded-3xl border border-emerald-500/25 bg-zinc-900 p-6 shadow-[0_20px_60px_-30px_rgba(16,185,129,0.4)] sm:p-8">
          <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-400">
            Entrenamiento de hoy
          </span>
          <p className="mt-8 text-sm text-zinc-400">Día 1</p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight text-zinc-50">
            Pecho y Tríceps
          </h2>
          <div className="mt-4 flex gap-5 text-sm text-zinc-400">
            <span>5 ejercicios</span>
            <span>~45 min</span>
          </div>
          <button
            onClick={() => setStarted(true)}
            className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 font-semibold text-zinc-950 hover:bg-emerald-300 sm:w-auto"
          >
            <Play className="size-4 fill-current" /> Iniciar entrenamiento
          </button>
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
              <Flame className="size-3.5 fill-current" /> 3 semanas
            </span>
          </div>
          <div className="mt-7 grid grid-cols-7 gap-2">
            {week.map((item) => (
              <div key={item.date} className="flex flex-col items-center gap-2">
                <span className="text-xs font-medium text-zinc-500">
                  {item.day}
                </span>
                <div
                  className={`flex size-9 items-center justify-center rounded-full text-xs font-semibold ${item.done ? "bg-emerald-400 text-zinc-950" : item.date === "14" ? "border-2 border-emerald-400 text-emerald-400" : "bg-zinc-800 text-zinc-500"}`}
                >
                  {item.done ? <Check className="size-4" /> : item.date}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-zinc-500">
            <span className="text-emerald-400">●</span> 3 entrenamientos
            completados
          </p>
        </section>
      </div>
      <section className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-400">Última sesión</p>
            <h2 className="mt-1 text-xl font-semibold text-zinc-50">
              Pierna y Hombros
            </h2>
            <p className="mt-1 text-xs text-zinc-500">Viernes, 11 de octubre</p>
          </div>
          <MoreHorizontal className="size-5 text-zinc-500" />
        </div>
        <div className="mt-6 grid grid-cols-3 divide-x divide-zinc-800">
          <div className="pr-3">
            <p className="text-xs text-zinc-500">Volumen</p>
            <p className="mt-2 text-lg font-semibold">
              4,250{" "}
              <span className="text-xs font-normal text-zinc-500">kg</span>
            </p>
          </div>
          <div className="px-3">
            <p className="text-xs text-zinc-500">Total sets</p>
            <p className="mt-2 text-lg font-semibold">
              16{" "}
              <span className="text-xs font-normal text-zinc-500">series</span>
            </p>
          </div>
          <div className="pl-3">
            <p className="text-xs text-zinc-500">Mejor levantamiento</p>
            <p className="mt-2 text-sm font-semibold">Sentadilla</p>
            <p className="text-xs text-emerald-400">100 kg × 8 reps</p>
          </div>
        </div>
        <button className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-400">
          Ver historial completo <ChevronRight className="size-4" />
        </button>
      </section>
      <section className="mt-8">
        <div>
          <p className="text-sm text-zinc-400">Tus rutinas</p>
          <h2 className="mt-1 text-xl font-semibold text-zinc-50">
            Acceso rápido
          </h2>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {routines.map(([name, type, count, color]) => (
            <button
              key={name}
              className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-left hover:border-zinc-700"
            >
              <Dumbbell
                className={`size-4 rounded-lg p-2 ${color} box-content`}
              />
              <p className="mt-5 font-semibold text-zinc-100">
                {name}: {type}
              </p>
              <p className="mt-1 text-xs text-zinc-500">{count}</p>
            </button>
          ))}
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
          <span>{session ? "Cuenta" : "Perfil"}</span>
        </Link>
      </nav>
    </main>
  );
}
