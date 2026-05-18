import { StandardError } from "../standard.error";
import { BaseUseCaseError } from "./base-usecase.error";
import { CodeError } from "./code.error";

export class DuplicateError extends StandardError implements BaseUseCaseError {
  constructor(path: string) {
    super({
      error: "DuplicateError",
      message: CodeError.DUPLICATE_RECORD,
      statusCode: 409,
      path,
    });
  }
}
