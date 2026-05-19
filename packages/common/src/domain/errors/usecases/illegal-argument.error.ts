import { StandardError } from "../standard.error";
import { BaseUseCaseError } from "./base-usecase.error";
import { CodeError } from "./code.error";

export class IllegalArgumentError extends StandardError implements BaseUseCaseError {
  constructor(path: string) {
    super({
      error: "IllegalArgumentError",
      message: CodeError.NOT_FOUND,
      statusCode: 400,
      path,
    });
  }
}
