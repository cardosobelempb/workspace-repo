import { StandardError } from "../standard.error";
import { BaseUseCaseError } from "./base-usecase.error";
import { CodeError } from "./code.error";

export class TokenExpiredError extends StandardError implements BaseUseCaseError {
  constructor(params: { fieldName: string; value?: string; message?: string }) {
    super({
      statusCode: 401,
      code: "TOKEN_EXPIRED",
      error: CodeError.TOKEN_EXPIRED,
      message: params.message ?? `${params.fieldName} "${params.value}" é inválido`,
      fieldName: params.fieldName,
    });
  }
}
