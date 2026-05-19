import { StandardError } from "../standard.error";
import { BaseUseCaseError } from "./base-usecase.error";
import { CodeError } from "./code.error";

export class ResourceNotFoundError extends StandardError implements BaseUseCaseError {
  constructor(path: string) {
    super({
      error: "ResourceNotFoundError",
      message: CodeError.NOT_FOUND,
      statusCode: 404,
      path,
    });
  }
}
