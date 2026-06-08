// packages/auth-core/src/application/use-cases/verify-magic-link.use-case.ts

import { AUTH_TOKEN_CONSTANTS } from "@/common/constants";
import {
  AlreadyExistsError,
  Either,
  HashGenerator,
  left,
  NotFoundError,
  right,
  TokenGenerator,
} from "@repo/common";
import type { MagicLinkRepository } from "../../domain/repositories/magic-link.repository";
import type { SessionCacheRepository } from "../../domain/repositories/session-cache.repository";
import type { SessionRepository } from "../../domain/repositories/session.repository";
import type { UserRepository } from "../../domain/repositories/user.repository";
import { MagicLinkTokenCreateDto, MagicLinkTokenUserProjectionDto } from "../dto";
import { SessionFactory, UserFactory } from "../factories";
import { UserMapper } from "../mappers/user.mapper";

export type VerifyMagicLinkError =
  | NotFoundError
  | AlreadyExistsError
  | { code: "TOKEN_ALREADY_USED" };

export class VerifyMagicLinkUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly magicLinkRepository: MagicLinkRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly sessionCacheRepository: SessionCacheRepository,
    private readonly tokenGenerator: TokenGenerator<{ token: string }>,
    private readonly hashGenerator: HashGenerator,
    private readonly sessionTtlSeconds: number = 604800,
  ) {}

  async execute(
    input: MagicLinkTokenCreateDto,
  ): Promise<Either<VerifyMagicLinkError, MagicLinkTokenUserProjectionDto>> {
    const tokenHash = this.tokenGenerator.verify(input.tokenHash);
    if (!tokenHash)
      return left(
        new NotFoundError({
          fieldName: "tokenHash",
          message: "Invalid magic link token",
        }),
      );
    const record = await this.magicLinkRepository.findValidByTokenHash(tokenHash.token);

    if (!record)
      return left(
        new NotFoundError({
          fieldName: "tokenHash",
          message: "Magic link token not found or invalid",
          value: tokenHash.token,
        }),
      );
    if (record.usedAt)
      return left(
        new AlreadyExistsError({
          fieldName: "tokenHash",
          message: "Magic link token has already been used",
          value: tokenHash.token,
        }),
      );
    if (record.expiresAt < new Date())
      return left(
        new NotFoundError({
          fieldName: "tokenHash",
          message: "Magic link token has expired",
          value: tokenHash.token,
        }),
      );

    await this.magicLinkRepository.markUsed(record.id.getValue(), new Date());

    let user = await this.userRepository.findByEmail(record.email.getValue().value);

    const userFactory = UserFactory.build({
      email: record.email.getValue().value,
      emailVerified: null,
      firstName: "",
      lastName: "",
      passwordHash: "",
    });

    if (!user) {
      user = await this.userRepository.create(userFactory);
    }

    const rawToken = await this.tokenGenerator.generate({ token: record.tokenHash });
    const sessionHash = await this.hashGenerator.hash(
      rawToken,
      AUTH_TOKEN_CONSTANTS.SESSION_TOKEN_SALT_ROUNDS,
    );
    const expiresAt = new Date(Date.now() + this.sessionTtlSeconds * 1000);

    const sessionFactory = SessionFactory.build({
      userId: user.id.getValue(),
      sessionToken: sessionHash,
      expires: expiresAt.toISOString(),
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    });

    const session = await this.sessionRepository.create(sessionFactory);

    await this.sessionCacheRepository.set(session);

    return right({
      tokenHash: rawToken,
      expiresAt: expiresAt.toISOString(),
      user: UserMapper.toProjection(user),
    });
  }
}
