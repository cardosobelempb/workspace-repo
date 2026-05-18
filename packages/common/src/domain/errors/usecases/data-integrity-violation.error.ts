import { StandardError } from "../standard.error";
import { BaseUseCaseError } from "./base-usecase.error";
import { CodeError } from "./code.error";

export class DataIntegrityViolationError
  extends StandardError
  implements BaseUseCaseError
{
  constructor(path: string) {
    super({
      error: "DataIntegrityViolationError",
      message: CodeError.DATA_INTEGRITY_VIOLATION,
      statusCode: 409,
      path,
    });
  }
}
