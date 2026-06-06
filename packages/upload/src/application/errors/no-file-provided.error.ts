import { BaseUseCaseError, StandardError } from "@repo/common";

export class NoFileProvidedError extends StandardError implements BaseUseCaseError {
  constructor(params: { fieldName: string; value?: string; message?: string }) {
    super({
      statusCode: 400,
      code: "FILE_TOO_LARGE",
      error: "FileTooLargeError",
      message: params.message ?? `${params.fieldName} "${params.value}" is too large.`,
      fieldName: params.fieldName,
    });
  }
}
