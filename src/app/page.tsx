import { ArrowUpRight, Rocket } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { env } from "@/lib/env";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 py-20">
      <div className="flex max-w-2xl flex-col gap-6">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-foreground/10 px-4 py-1.5 text-sm text-foreground/70">
          <Rocket className="size-4" aria-hidden="true" />
          <span>Next.js 15 · TypeScript · Tailwind v4</span>
        </div>

        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          {env.NEXT_PUBLIC_APP_NAME}
        </h1>

        <p className="text-lg leading-8 text-foreground/70">
          Proyecto inicializado con App Router, Server Components por defecto,
          validación de variables de entorno y una estructura escalable bajo{" "}
          <code className="rounded bg-foreground/5 px-1.5 py-0.5 font-mono text-sm">
            src/
          </code>
          .
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="https://nextjs.org/docs"
            target="_blank"
            rel="noreferrer"
            className={buttonVariants()}
          >
            Documentación
            <ArrowUpRight className="ml-2 size-4" aria-hidden="true" />
          </Link>

          <Link
            href="https://vercel.com/new"
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: "secondary" })}
          >
            Desplegar en Vercel
          </Link>
        </div>
      </div>
    </main>
  );
}
