// packages/auth-core/src/application/use-cases/me.use-case.ts

import { Either, left, NotFoundError, right } from "@repo/common";
import { UserRepository } from "../../domain/repositories/user.repository";
import { UserProjectionDto } from "../dto/user.dto";
import { UserMapper } from "../mappers/user.mapper";

export class MeUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(
    userId: string,
  ): Promise<Either<NotFoundError, { user: UserProjectionDto }>> {
    const user = await this.userRepository.findById(userId);

    if (!user || user.deletedAt) {
      return left(
        new NotFoundError({
          fieldName: "userId",
          value: userId,
          message: "User not found",
        }),
      );
    }

    return right({ user: UserMapper.toProjection(user) });
  }
}
