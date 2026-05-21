import { z } from "zod";

export type EnvIssue = {
  field: string;
  message: string;
};

export type CreateEnvOptions = {
  source?: NodeJS.ProcessEnv;
  context?: string;
  exitOnError?: boolean;
  onError?: (issues: EnvIssue[]) => void;
};

export function createEnv<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  options: CreateEnvOptions = {},
): z.infer<TSchema> {
  const {
    source = process.env,
    context = "process.env",
    exitOnError = true,
    onError,
  } = options;

  const parsed = schema.safeParse(source);

  if (parsed.success) {
    return parsed.data;
  }

  const issues: EnvIssue[] = parsed.error.issues.map((issue) => ({
    field: issue.path.join(".") || "env",
    message: issue.message,
  }));

  if (onError) {
    onError(issues);
  } else {
    console.error({
      name: "EnvValidationError",
      context,
      message: "Invalid environment variables",
      issues,
    });
  }

  if (exitOnError) {
    process.exit(1);
  }

  throw new Error(`Invalid environment variables in ${context}`);
}
