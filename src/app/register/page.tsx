import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Crear cuenta",
  description: "Registra tu cuenta para entrenar con Gym Tracker.",
};

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-10">
      <Link
        href="/"
        className="mb-6 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-200"
      >
        Volver al inicio
      </Link>
      <RegisterForm />
    </main>
  );
}
