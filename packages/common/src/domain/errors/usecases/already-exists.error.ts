import { StandardError } from "../standard.error";
import { BaseUseCaseError } from "./base-usecase.error";

export class AlreadyExistsError extends StandardError implements BaseUseCaseError {
  constructor(params: { fieldName: string; value?: string; message?: string }) {
    super({
      statusCode: 409,
      code: "ALREADY_EXISTS",
      error: "Conflict",
      message: params.message ?? `${params.fieldName} "${params.value}" já existe`,
      fieldName: params.fieldName,
    });
  }
}
