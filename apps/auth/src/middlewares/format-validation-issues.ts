import { StandardError } from "@repo/common";

type FastifyValidationIssue = {
  instancePath?: string;
  message?: string;
  params?: {
    missingProperty?: string;
  };
};

export function formatValidationIssues(
  validation: FastifyValidationIssue[] = [],
  fallbackMessage = "validation failed",
) {
  if (!validation.length) {
    return [
      {
        field: "body",
        message: fallbackMessage,
      },
    ];
  }

  return validation.map((issue) => {
    const field =
      issue.params?.missingProperty ||
      issue.instancePath?.replace(/^\//, "").replace(/\//g, ".") ||
      "body";

    return {
      field,
      message: issue.message || fallbackMessage,
    };
  });
}

export function normalizeError(error: StandardError) {
  return {
    statusCode: error.statusCode,
    error: error.error,
    message: error.message,
  };
}

export function serializeError(error: any) {
  return {
    name: error?.name,
    message: error?.message,
    code: error?.code,
    statusCode: error?.statusCode,
    fieldName: error?.fieldName,
    validationContext: error?.validationContext,
    validation: error?.validation?.map((v: any) => ({
      field: v.field,
      message: v.message,
    })),
  };
}
