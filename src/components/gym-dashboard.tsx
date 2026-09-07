"use client";

import {
  CalendarDays,
  Check,
  ChevronRight,
  CircleUserRound,
  Dumbbell,
  Edit3,
  Flame,
  Home,
  MoreHorizontal,
  Play,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";

const week = [
  { day: "L", date: "14", state: "today" },
  { day: "M", date: "15", state: "done" },
  { day: "X", date: "16", state: "done" },
  { day: "J", date: "17", state: "rest" },
  { day: "V", date: "18", state: "done" },
  { day: "S", date: "19", state: "rest" },
  { day: "D", date: "20", state: "rest" },
];

const routines = [
  ["Rutina A", "Torso", "6 ejercicios", "bg-cyan-500/10 text-cyan-400"],
  ["Rutina B", "Pierna", "5 ejercicios", "bg-emerald-500/10 text-emerald-400"],
  ["Rutina C", "Fullbody", "7 ejercicios", "bg-amber-500/10 text-amber-400"],
];

const navItems: { icon: LucideIcon; label: string }[] = [
  { icon: Home, label: "Inicio" },
  { icon: Dumbbell, label: "Rutinas" },
  { icon: CalendarDays, label: "Historial" },
  { icon: UserRound, label: "Perfil" },
];

export function GymDashboard() {
  const [started, setStarted] = useState(false);

  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-28 pt-7 sm:px-8 lg:pb-10">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-emerald-400">
            LUNES, 14 DE OCTUBRE
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
            ¡Hola, Alex!
          </h1>
          <p className="mt-1 text-sm leading-6 text-zinc-400">
            Listo para entrenar hoy
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-xs text-zinc-400 sm:flex">
            <span className="size-2 rounded-full bg-emerald-400" /> Sincronizado
          </div>
          <button
            aria-label="Abrir perfil"
            className="rounded-full border border-zinc-700 bg-zinc-900 p-2 text-zinc-300 transition hover:border-emerald-400 hover:text-emerald-400"
          >
            <CircleUserRound className="size-6" />
          </button>
        </div>
      </header>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <section className="relative overflow-hidden rounded-3xl border border-emerald-500/25 bg-zinc-900 p-6 shadow-[0_20px_60px_-30px_rgba(16,185,129,0.4)] sm:p-8">
          <div className="absolute right-0 top-0 size-40 rounded-bl-full bg-emerald-500/10" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-400">
                Entrenamiento de hoy
              </span>
              <MoreHorizontal className="size-5 text-zinc-500" />
            </div>
            <p className="mt-8 text-sm text-zinc-400">Día 1</p>
            <h2 className="mt-1 text-3xl font-bold tracking-tight text-zinc-50">
              Pecho y Tríceps
            </h2>
            <div className="mt-4 flex gap-5 text-sm text-zinc-400">
              <span>5 ejercicios</span>
              <span>~45 min</span>
            </div>
            <button
              onClick={() => setStarted(!started)}
              className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 font-semibold text-zinc-950 transition hover:bg-emerald-300 sm:w-auto"
            >
              <Play className="size-4 fill-current" />{" "}
              {started ? "Entrenamiento iniciado" : "Iniciar entrenamiento"}
            </button>
          </div>
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
                  className={`flex size-9 items-center justify-center rounded-full text-xs font-semibold ${item.state === "done" ? "bg-emerald-400 text-zinc-950" : item.state === "today" ? "border-2 border-emerald-400 text-emerald-400" : "bg-zinc-800 text-zinc-500"}`}
                >
                  {item.state === "done" ? (
                    <Check className="size-4" />
                  ) : (
                    item.date
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-zinc-500">
            <span className="text-emerald-400">●</span> 3 entrenamientos
            completados <span className="ml-3 text-zinc-700">●</span> Descanso
          </p>
        </section>
      </div>

      <section className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-900 p-6 sm:p-7">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-400">Última sesión</p>
            <h2 className="mt-1 text-xl font-semibold text-zinc-50">
              Pierna y Hombros
            </h2>
            <p className="mt-1 text-xs text-zinc-500">Viernes, 11 de octubre</p>
          </div>
          <button
            aria-label="Más opciones"
            className="text-zinc-500 hover:text-zinc-300"
          >
            <MoreHorizontal className="size-5" />
          </button>
        </div>
        <div className="mt-6 grid grid-cols-3 divide-x divide-zinc-800">
          <div className="pr-3">
            <p className="text-xs text-zinc-500">Volumen</p>
            <p className="mt-2 text-lg font-semibold text-zinc-100">
              4,250{" "}
              <span className="text-xs font-normal text-zinc-500">kg</span>
            </p>
          </div>
          <div className="px-3">
            <p className="text-xs text-zinc-500">Total sets</p>
            <p className="mt-2 text-lg font-semibold text-zinc-100">
              16{" "}
              <span className="text-xs font-normal text-zinc-500">series</span>
            </p>
          </div>
          <div className="pl-3">
            <p className="text-xs text-zinc-500">Mejor levantamiento</p>
            <p className="mt-2 text-sm font-semibold text-zinc-100">
              Sentadilla
            </p>
            <p className="text-xs text-emerald-400">100 kg × 8 reps</p>
          </div>
        </div>
        <button className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-400 hover:text-emerald-300">
          Ver historial completo <ChevronRight className="size-4" />
        </button>
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-400">Tus rutinas</p>
            <h2 className="mt-1 text-xl font-semibold text-zinc-50">
              Acceso rápido
            </h2>
          </div>
          <button className="text-sm font-medium text-emerald-400">
            Ver todas
          </button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {routines.map(([name, type, count, color]) => (
            <button
              key={name}
              className="group rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-left transition hover:-translate-y-0.5 hover:border-zinc-700"
            >
              <div className="flex items-start justify-between">
                <span className={`rounded-lg p-2 ${color}`}>
                  <Dumbbell className="size-4" />
                </span>
                <Edit3 className="size-4 text-zinc-600 transition group-hover:text-zinc-300" />
              </div>
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
        {navItems.map(({ icon: Icon, label }, index) => (
          <button
            key={label}
            className={`flex min-w-16 flex-col items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-medium ${index === 0 ? "text-emerald-400" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            <Icon className="size-5" />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </main>
  );
}
