export { BaseEntity } from "./domain/entities/base.entity";
export { BaseEntityBuild } from "./domain/entities/entity-build.entity";

export { left, right, type Either } from "./domain/errors/handle-errors/either";
export { Left } from "./domain/errors/handle-errors/left";
export { Right } from "./domain/errors/handle-errors/right";

export { BadRequestError } from "./domain/errors/controllers/bad-request.error";
export { StandardError } from "./domain/errors/standard.error";
export { NotFoundError } from "./domain/errors/usecases/not-found.error";
export { ValidationError } from "./domain/errors/validation.error";

export { BaseInMemoryRepository } from "./domain/repositories/in-memory-repository/base-repository-in-memory";
export type { SearchInput } from "./domain/repositories/search.repository";
export type {
  Page,
  Pageable,
  PageInput,
  Sort,
} from "./domain/repositories/types/pagination.types";

export { BaseVO } from "./domain/values-objects/base.vo";
export { NameVO } from "./domain/values-objects/name/name.vo";
export { SlugVO } from "./domain/values-objects/slug/slug.vo";
export { UUIDVO } from "./domain/values-objects/uuidvo/uuid.vo";

export type { BaseUseCaseError as AppBaseUseCaseError } from "./application/errors/base-usecase.error";
export { BaseUseCase as AppBaseUseCase } from "./application/usecase/base-usecase";
