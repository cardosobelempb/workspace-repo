import { BaseControllerError } from "../controllers";
import { StandardError } from "../standard.error";
import { CodeError } from "../usecases/code.error";

export class UnexpectedError extends StandardError implements BaseControllerError {
  constructor(params: { fieldName: string; value?: string; message?: string }) {
    super({
      statusCode: 400,
      code: CodeError.BAD_REQUEST,
      error: "UnexpectedError",
      message: params.message || "An unexpected error occurred.",
      fieldName: params.fieldName,
    });
  }
}
