"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LoaderCircle, LogIn } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { findRegisteredUser, saveAuthSession } from "@/lib/auth-storage";

const AUTH_CHECK_DELAY_MS = 1000;

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "El correo es obligatorio")
    .email("Ingresa un correo válido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const loginDefaultValues: LoginFormValues = {
  email: "",
  password: "",
};

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function LoginForm() {
  const router = useRouter();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: loginDefaultValues,
    mode: "onChange",
  });

  const emailField = register("email");
  const passwordField = register("password");
  const isBusy = isSubmitting || isAuthenticating;
  const isSubmitDisabled = !isValid || isBusy;

  const validationAlerts = (
    [
      { id: "email", message: errors.email?.message },
      { id: "password", message: errors.password?.message },
    ] as const
  ).flatMap((alert) =>
    alert.message ? [{ id: alert.id, message: alert.message }] : [],
  );

  const feedbackAlerts = authError
    ? [...validationAlerts, { id: "credentials", message: authError }]
    : validationAlerts;

  const authenticate = handleSubmit(async (values) => {
    setAuthError(null);
    setIsAuthenticating(true);

    let didAuthenticate = false;

    try {
      await wait(AUTH_CHECK_DELAY_MS);

      const user = findRegisteredUser(values.email, values.password);

      if (!user) {
        setAuthError("El correo o la contraseña no son correctos.");
        return;
      }

      saveAuthSession(user);
      didAuthenticate = true;
      router.push("/");
    } finally {
      if (!didAuthenticate) setIsAuthenticating(false);
    }
  });

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const submitter = event.currentTarget.querySelector<HTMLButtonElement>(
      'button[type="submit"]',
    );

    if (
      !submitter ||
      submitter.disabled ||
      submitter.dataset.pending === "true"
    ) {
      return;
    }

    submitter.dataset.pending = "true";
    void authenticate(event).finally(() => {
      delete submitter.dataset.pending;
    });
  }

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-[0_20px_60px_-30px_rgba(16,185,129,0.35)] sm:p-8">
      <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
        <LogIn className="size-5" />
      </div>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
        Gym Tracker
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-50">
        Iniciar sesión
      </h1>
      <p className="mt-2 text-sm leading-6 text-zinc-400">
        Entra con el correo y la contraseña de tu cuenta registrada.
      </p>

      <form className="mt-8 space-y-5" noValidate onSubmit={onSubmit}>
        <div>
          <label htmlFor="email" className="text-sm font-medium text-zinc-200">
            Correo electrónico
          </label>
          <input
            {...emailField}
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="ana@correo.com"
            disabled={isBusy}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "email-error" : undefined}
            onChange={(event) => {
              setAuthError(null);
              void emailField.onChange(event);
            }}
            className="mt-2 h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-zinc-50 outline-none transition placeholder:text-zinc-600 focus:border-emerald-400 disabled:opacity-60"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="text-sm font-medium text-zinc-200"
          >
            Contraseña
          </label>
          <div className="relative mt-2">
            <input
              {...passwordField}
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Tu contraseña"
              disabled={isBusy}
              aria-invalid={errors.password ? true : undefined}
              aria-describedby={errors.password ? "password-error" : undefined}
              onChange={(event) => {
                setAuthError(null);
                void passwordField.onChange(event);
              }}
              className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 pr-12 text-sm text-zinc-50 outline-none transition placeholder:text-zinc-600 focus:border-emerald-400 disabled:opacity-60"
            />
            <button
              type="button"
              aria-label={
                showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
              }
              aria-pressed={showPassword}
              disabled={isBusy}
              onClick={() => setShowPassword((current) => !current)}
              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-zinc-500 hover:text-zinc-200 disabled:opacity-60"
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
        </div>

        {feedbackAlerts.length > 0 ? (
          <ul className="space-y-2" aria-live="polite">
            {feedbackAlerts.map((alert) => (
              <li
                key={alert.id}
                id={
                  alert.id === "credentials" ? undefined : `${alert.id}-error`
                }
                role={alert.id === "credentials" ? "alert" : undefined}
                className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300"
              >
                {alert.message}
              </li>
            ))}
          </ul>
        ) : null}

        <Button
          type="submit"
          size="lg"
          disabled={isSubmitDisabled}
          aria-busy={isBusy}
          className="w-full rounded-xl bg-emerald-400 font-semibold text-zinc-950 hover:bg-emerald-300 hover:opacity-100"
        >
          {isBusy ? (
            <>
              <LoaderCircle className="mr-2 size-4 animate-spin" />
              Verificando...
            </>
          ) : (
            "Iniciar sesión"
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-400">
        ¿No tienes cuenta?{" "}
        <Link
          href="/register"
          className="font-semibold text-emerald-400 hover:text-emerald-300"
        >
          Crear cuenta
        </Link>
      </p>
    </section>
  );
}
