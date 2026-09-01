import { z } from "zod";

const serverSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.string().url().optional(),
  API_SECRET_KEY: z.string().min(1).optional(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default("AI Builder"),
});

function parseEnv<T extends z.ZodType>(
  schema: T,
  data: unknown,
  label: string,
): z.infer<T> {
  const result = schema.safeParse(data);

  if (!result.success) {
    console.error(
      `Invalid ${label} environment variables:`,
      result.error.flatten().fieldErrors,
    );
    throw new Error(`Invalid ${label} environment variables`);
  }

  return result.data;
}

const serverEnv = parseEnv(serverSchema, process.env, "server");
const clientEnv = parseEnv(
  clientSchema,
  {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  },
  "client",
);

export const env = {
  ...serverEnv,
  ...clientEnv,
};

export type Env = typeof env;
