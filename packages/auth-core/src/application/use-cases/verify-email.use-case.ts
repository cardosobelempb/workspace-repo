// packages/auth-core/src/application/use-cases/verify-email.use-case.ts

import { AUTH_TOKEN_CONSTANTS } from "@/common/constants";
import { EmailVerificationTokenRepository } from "@/common/domain";
import {
  AlreadyExistsError,
  Either,
  HashGenerator,
  left,
  NotFoundError,
  right,
  TokenGenerator,
} from "@repo/common";
import type { UserRepository } from "../../domain/repositories/user.repository";

export type VerifyEmailInput = { token: string };

export type VerifyEmailError =
  | NotFoundError
  | AlreadyExistsError
  | { code: "TOKEN_ALREADY_USED" };

export class VerifyEmailUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailVerificationRepository: EmailVerificationTokenRepository,
    private readonly hashGenerator: HashGenerator,
    private readonly tokenGenerator: TokenGenerator<{ length: number }>,
  ) {}

  async execute(input: VerifyEmailInput): Promise<Either<VerifyEmailError, void>> {
    const tokenHash = await this.hashGenerator.hash(
      input.token,
      AUTH_TOKEN_CONSTANTS.SESSION_TOKEN_SALT_ROUNDS,
    );
    const record = await this.emailVerificationRepository.findValidByTokenHash(tokenHash);

    if (!record)
      return left(
        new NotFoundError({
          fieldName: "token",
          message: "Email verification token not found or invalid",
          value: input.token,
        }),
      );

    if (record.usedAt)
      return left(
        new AlreadyExistsError({ fieldName: "token", message: "Token already used" }),
      );
    if (record.expiresAt < new Date())
      return left(
        new NotFoundError({
          fieldName: "token",
          message: "Token expired",
          value: input.token,
        }),
      );

    await this.emailVerificationRepository.markUsed(record.id.getValue(), new Date());
    await this.userRepository.markEmailVerified(record.userId.getValue(), new Date());

    return right(undefined);
  }
}
