import { CalendarDays, Dumbbell, History, ShieldCheck } from "lucide-react";
import Link from "next/link";

const highlights = [
  {
    title: "Rutina del día",
    description:
      "El entrenamiento de hoy, con ejercicios y duración, listo para empezar.",
    icon: Dumbbell,
  },
  {
    title: "Semana y racha",
    description: "Los días entrenados y cuántas semanas llevas seguidas.",
    icon: CalendarDays,
  },
  {
    title: "Historial",
    description:
      "Volumen, series y el mejor levantamiento de cada sesión guardada.",
    icon: History,
  },
] as const;

export function GuestHome() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 pb-16 pt-7 sm:px-8">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
            <Dumbbell className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-zinc-50">Gym Tracker</p>
            <p className="text-xs text-zinc-500">Estás como invitado</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/login"
            className="inline-flex h-10 items-center whitespace-nowrap rounded-xl px-3 text-sm font-semibold text-zinc-300 hover:text-zinc-50 sm:px-4"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="inline-flex h-10 items-center whitespace-nowrap rounded-xl bg-emerald-400 px-3 text-sm font-semibold text-zinc-950 hover:bg-emerald-300 sm:px-4"
          >
            Crear cuenta
          </Link>
        </div>
      </header>

      <section className="mt-10 grid items-stretch gap-5 lg:grid-cols-[1.35fr_1fr]">
        <div className="rounded-3xl border border-emerald-500/25 bg-zinc-900 p-6 shadow-[0_20px_60px_-30px_rgba(16,185,129,0.4)] sm:p-8">
          <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-400">
            Inicio general
          </span>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-zinc-50 sm:text-5xl">
            Tu entrenamiento, más simple.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-400 sm:text-base">
            Gym Tracker guarda la rutina del día, la semana y el historial de
            cada sesión. Como invitado puedes ver cómo está organizado el
            inicio. Para guardar tu progreso necesitas una cuenta.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-emerald-400 px-5 font-semibold text-zinc-950 hover:bg-emerald-300"
            >
              Crear cuenta
            </Link>
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-zinc-700 px-5 font-semibold text-zinc-100 hover:border-emerald-400 hover:text-emerald-300"
            >
              Ya tengo cuenta
            </Link>
          </div>
        </div>

        <aside className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center gap-2 text-emerald-400">
            <ShieldCheck className="size-4" />
            <p className="text-sm font-medium">Qué queda en tu cuenta</p>
          </div>
          <h2 className="mt-4 text-xl font-semibold text-zinc-50">
            El panel personal no se muestra sin sesión
          </h2>
          <ul className="mt-6 space-y-4 text-sm leading-6 text-zinc-400">
            <li>La rutina de hoy y el botón para iniciarla.</li>
            <li>El progreso de la semana y la racha.</li>
            <li>La última sesión, el volumen y tus rutinas.</li>
          </ul>
          <p className="mt-6 text-xs leading-5 text-zinc-500">
            Un invitado no ve sesiones de otra persona ni deja series guardadas.
          </p>
        </aside>
      </section>

      <section className="mt-8">
        <p className="text-sm text-zinc-400">Dentro de la app</p>
        <h2 className="mt-1 text-xl font-semibold text-zinc-50">
          Lo que desbloquea tu cuenta
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {highlights.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4"
            >
              <item.icon className="size-4 rounded-lg bg-emerald-500/10 p-2 text-emerald-400 box-content" />
              <h3 className="mt-5 font-semibold text-zinc-100">{item.title}</h3>
              <p className="mt-1 text-sm leading-6 text-zinc-500">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
