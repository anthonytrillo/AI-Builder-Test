"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Eye, EyeOff, LoaderCircle, UserPlus } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useForm, useWatch, type FieldError } from "react-hook-form";
import { registerAccount } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  PASSWORD_RULES,
  registerDefaultValues,
  registerSchema,
  type RegisterFormValues,
} from "@/lib/validations/register";

const inputClassName =
  "h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-zinc-50 outline-none transition placeholder:text-zinc-600 focus:border-emerald-400 disabled:opacity-60";

function getErrorMessages(error: FieldError | undefined): string[] {
  if (!error) return [];

  const messages: string[] = [];

  if (error.message) messages.push(error.message);

  const custom = error.types?.custom;
  if (typeof custom === "string") messages.push(custom);
  if (Array.isArray(custom)) {
    for (const item of custom) {
      if (typeof item === "string") messages.push(item);
    }
  }

  return [...new Set(messages)];
}

export function RegisterForm() {
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const {
    clearErrors,
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isValid },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: registerDefaultValues,
    mode: "onChange",
    reValidateMode: "onChange",
    criteriaMode: "all",
  });

  const [fullName, email, password, confirmPassword, terms] = useWatch({
    control,
    name: ["fullName", "email", "password", "confirmPassword", "terms"],
  });

  const isBusy = isSubmitting || isSaving;
  const missingRequiredFields =
    fullName.trim().length === 0 ||
    email.trim().length === 0 ||
    password.length === 0 ||
    confirmPassword.length === 0 ||
    terms !== true;
  const isSubmitDisabled = !isValid || missingRequiredFields || isBusy;

  const fullNameField = register("fullName");
  const emailField = register("email");
  const passwordField = register("password");
  const confirmPasswordField = register("confirmPassword");
  const termsField = register("terms");

  const validationAlerts = (
    [
      { id: "fullName", messages: getErrorMessages(errors.fullName) },
      { id: "email", messages: getErrorMessages(errors.email) },
      {
        id: "password",
        messages: getErrorMessages(errors.password).filter(
          (message) => !PASSWORD_RULES.some((rule) => rule.label === message),
        ),
      },
      {
        id: "confirmPassword",
        messages: getErrorMessages(errors.confirmPassword),
      },
      { id: "terms", messages: getErrorMessages(errors.terms) },
    ] as const
  ).flatMap((field) =>
    field.messages.map((message) => ({
      id: `${field.id}:${message}`,
      message,
    })),
  );

  const feedbackAlerts = errors.root?.message
    ? [...validationAlerts, { id: "root", message: errors.root.message }]
    : validationAlerts;

  const saveRegistration = handleSubmit(async (values) => {
    setConfirmation(null);
    setIsSaving(true);

    try {
      const result = await registerAccount(values);

      if (!result.ok) {
        if (result.field) {
          setError(result.field, { type: "server", message: result.message });
          return;
        }

        setError("root", { type: "server", message: result.message });
        return;
      }

      setConfirmation(
        `Cuenta creada para ${result.fullName}. Ya puedes iniciar sesión.`,
      );
      reset(registerDefaultValues);
    } catch {
      setError("root", {
        type: "server",
        message: "No se pudo crear la cuenta. Inténtalo de nuevo.",
      });
    } finally {
      setIsSaving(false);
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
    void saveRegistration(event).finally(() => {
      delete submitter.dataset.pending;
    });
  }

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-[0_20px_60px_-30px_rgba(16,185,129,0.35)] sm:p-8">
      <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
        <UserPlus className="size-5" />
      </div>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
        Gym Tracker
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-50">
        Crear cuenta
      </h1>
      <p className="mt-2 text-sm leading-6 text-zinc-400">
        Registra tus datos para guardar tu perfil.
      </p>

      {confirmation ? (
        <div
          role="status"
          className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
        >
          <Check className="mt-0.5 size-4 shrink-0" />
          <p>{confirmation}</p>
        </div>
      ) : null}

      <form
        className="mt-8 space-y-5"
        noValidate
        onChange={() => clearErrors("root")}
        onSubmit={onSubmit}
      >
        <div>
          <label
            htmlFor="fullName"
            className="text-sm font-medium text-zinc-200"
          >
            Nombre completo
          </label>
          <input
            {...fullNameField}
            id="fullName"
            type="text"
            autoComplete="name"
            placeholder="Ana Pérez"
            disabled={isBusy}
            aria-invalid={errors.fullName ? true : undefined}
            aria-required="true"
            onChange={(event) => {
              setConfirmation(null);
              void fullNameField.onChange(event);
            }}
            className={cn(inputClassName, "mt-2")}
          />
        </div>

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
            aria-required="true"
            onChange={(event) => {
              setConfirmation(null);
              void emailField.onChange(event);
            }}
            className={cn(inputClassName, "mt-2")}
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
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              disabled={isBusy}
              aria-invalid={errors.password ? true : undefined}
              aria-describedby="password-rules"
              aria-required="true"
              onChange={(event) => {
                setConfirmation(null);
                void passwordField.onChange(event);
              }}
              className={cn(inputClassName, "pr-12")}
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
          <ul id="password-rules" className="mt-3 space-y-1.5">
            {PASSWORD_RULES.map((rule) => {
              const met = rule.test(password);
              const showInvalid = !met && Boolean(errors.password);

              return (
                <li
                  key={rule.id}
                  className={cn(
                    "flex items-center gap-2 text-sm",
                    met && "text-emerald-400",
                    !met && !showInvalid && "text-zinc-500",
                    showInvalid && "text-red-300",
                  )}
                >
                  <Check className={cn("size-3.5", !met && "opacity-40")} />
                  {rule.label}
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="text-sm font-medium text-zinc-200"
          >
            Confirmar contraseña
          </label>
          <div className="relative mt-2">
            <input
              {...confirmPasswordField}
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Repite tu contraseña"
              disabled={isBusy}
              aria-invalid={errors.confirmPassword ? true : undefined}
              aria-required="true"
              onChange={(event) => {
                setConfirmation(null);
                void confirmPasswordField.onChange(event);
              }}
              className={cn(inputClassName, "pr-12")}
            />
            <button
              type="button"
              aria-label={
                showConfirmPassword
                  ? "Ocultar confirmación de contraseña"
                  : "Mostrar confirmación de contraseña"
              }
              aria-pressed={showConfirmPassword}
              disabled={isBusy}
              onClick={() => setShowConfirmPassword((current) => !current)}
              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-zinc-500 hover:text-zinc-200 disabled:opacity-60"
            >
              {showConfirmPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="flex items-start gap-3 text-sm leading-6 text-zinc-300">
            <input
              {...termsField}
              type="checkbox"
              disabled={isBusy}
              aria-invalid={errors.terms ? true : undefined}
              aria-required="true"
              onChange={(event) => {
                setConfirmation(null);
                void termsField.onChange(event);
              }}
              className="mt-1 size-4 shrink-0 accent-emerald-400"
            />
            <span>Acepto los términos y condiciones</span>
          </label>
        </div>

        {feedbackAlerts.length > 0 ? (
          <ul className="space-y-2" aria-live="polite">
            {feedbackAlerts.map((alert) => (
              <li
                key={alert.id}
                role="alert"
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
              Creando cuenta...
            </>
          ) : (
            "Crear cuenta"
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-400">
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/login"
          className="font-semibold text-emerald-400 hover:text-emerald-300"
        >
          Iniciar sesión
        </Link>
      </p>
    </section>
  );
}
