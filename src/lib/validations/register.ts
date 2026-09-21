import { z } from "zod";

export const PASSWORD_RULES = [
  {
    id: "min-length",
    label: "Mínimo 8 caracteres",
    test: (value: string) => value.length >= 8,
  },
  {
    id: "uppercase",
    label: "Al menos una mayúscula",
    test: (value: string) => /[A-Z]/.test(value),
  },
  {
    id: "number",
    label: "Al menos un número",
    test: (value: string) => /\d/.test(value),
  },
  {
    id: "special",
    label: "Al menos un carácter especial",
    test: (value: string) => /[^A-Za-z0-9]/.test(value),
  },
] as const;

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(1, "El nombre completo es obligatorio")
      .min(2, "El nombre debe tener al menos 2 caracteres"),
    email: z
      .string()
      .trim()
      .min(1, "El correo electrónico es obligatorio")
      .email("Ingresa un correo electrónico válido"),
    password: z.string().superRefine((value, context) => {
      if (value.length === 0) {
        context.addIssue({
          code: "custom",
          message: "La contraseña es obligatoria",
        });
        return;
      }

      for (const rule of PASSWORD_RULES) {
        if (!rule.test(value)) {
          context.addIssue({ code: "custom", message: rule.label });
        }
      }
    }),
    confirmPassword: z.string().min(1, "Confirma tu contraseña"),
    terms: z.boolean().refine((accepted) => accepted, {
      error: "Debes aceptar los términos y condiciones",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    error: "Las contraseñas no coinciden",
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const registerDefaultValues: RegisterFormValues = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  terms: false,
};
