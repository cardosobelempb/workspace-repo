import { StandardError } from "../standard.error";
import { BaseUseCaseError } from "./base-usecase.error";
import { CodeError } from "./code.error";

export class JsonWebTokenError extends StandardError implements BaseUseCaseError {
  constructor(params: { fieldName: string; value?: string; message?: string }) {
    super({
      statusCode: 401,
      code: "JWT_ERROR",
      error: CodeError.JWT_ERROR,
      message: params.message ?? `${params.fieldName} "${params.value}" é inválido`,
      fieldName: params.fieldName,
    });
  }
}
