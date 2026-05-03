import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1).optional(),
  SESSION_SECRET: z.string().min(12).default("replace-me-in-dev"),
  ALLOW_DEV_AUTH: z.enum(["true", "false"]).default("false"),
  ALLOW_DEV_AUDIT: z.enum(["true", "false"]).default("false"),
  CORS_ORIGIN: z.string().optional(),
});

export type AppEnv = z.infer<typeof envSchema> & {
  isProduction: boolean;
  isDevAuthEnabled: boolean;
  isDevAuditEnabled: boolean;
};

export function loadEnv(input: NodeJS.ProcessEnv = process.env): AppEnv {
  const parsed = envSchema.parse(input);
  const isProduction = parsed.NODE_ENV === "production";

  if (isProduction && parsed.SESSION_SECRET === "replace-me-in-dev") {
    throw new Error("SESSION_SECRET must be changed outside local development");
  }

  if (isProduction && parsed.ALLOW_DEV_AUTH === "true") {
    throw new Error("ALLOW_DEV_AUTH cannot be true in production");
  }

  return {
    ...parsed,
    isProduction,
    isDevAuthEnabled: !isProduction && parsed.ALLOW_DEV_AUTH === "true",
    isDevAuditEnabled: !isProduction && parsed.ALLOW_DEV_AUDIT === "true",
  };
}
