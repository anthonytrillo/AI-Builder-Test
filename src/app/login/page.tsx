import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description: "Entra a Gym Tracker con tu correo y contraseña.",
};

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-10">
      <Link
        href="/"
        className="mb-6 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-200"
      >
        Volver al inicio
      </Link>
      <LoginForm />
    </main>
  );
}
