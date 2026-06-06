import { BaseUseCaseError, StandardError } from "@repo/common";

export class InvalidFileTypeError extends StandardError implements BaseUseCaseError {
  constructor(params: { fieldName: string; value?: string; message?: string }) {
    super({
      statusCode: 400,
      code: "INVALID_FILE_TYPE",
      error: "InvalidFileTypeError",
      message:
        params.message ??
        `${params.fieldName} "${params.value}" is not an allowed file type.`,
      fieldName: params.fieldName,
    });
  }
}
