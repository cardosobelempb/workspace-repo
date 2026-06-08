// packages/auth-core/src/application/use-cases/validate-otp.use-case.ts

import { AUTH_TOKEN_CONSTANTS } from "@/common/constants";
import {
  OtpCodeRepository,
  SessionCacheRepository,
  SessionRepository,
  UserEntity,
} from "@/common/domain";
import { Either, HashGenerator, left, right, TokenGenerator } from "@repo/common";
import type { UserRepository } from "../../domain/repositories/user.repository";
import { SessionFactory, UserFactory } from "../factories";

export type ValidateOtpInput = {
  email: string;
  code: string;
  purpose: string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type ValidateOtpOutput = {
  sessionToken: string;
  expiresAt: Date;
  user: Omit<UserEntity, "passwordHash">;
};

export type ValidateOtpError =
  | { code: "OTP_NOT_FOUND" }
  | { code: "OTP_EXPIRED" }
  | { code: "OTP_ALREADY_USED" }
  | { code: "OTP_MAX_ATTEMPTS" }
  | { code: "OTP_INVALID" };

export class ValidateOtpUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly otpRepository: OtpCodeRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly sessionCacheRepository: SessionCacheRepository,
    private readonly hashGenerator: HashGenerator,
    private readonly tokenGenerator: TokenGenerator<{ length: number }>,
    private readonly sessionTtlSeconds: number = 604800,
  ) {}

  async execute(
    input: ValidateOtpInput,
  ): Promise<Either<ValidateOtpError, ValidateOtpOutput>> {
    const otp = await this.otpRepository.findValidByEmailAndPurpose(
      input.email,
      input.purpose,
    );

    if (!otp) return left({ code: "OTP_NOT_FOUND" });
    if (otp.usedAt) return left({ code: "OTP_ALREADY_USED" });
    if (otp.expiredAt < new Date()) return left({ code: "OTP_EXPIRED" });
    if (otp.attempts >= otp.maxAttempts) return left({ code: "OTP_MAX_ATTEMPTS" });

    const valid = this.tokenGenerator.verify(otp.codeHash);

    if (!valid) {
      await this.otpRepository.incrementAttempts(otp.id.getValue());
      return left({ code: "OTP_INVALID" });
    }

    await this.otpRepository.markUsed(otp.id.getValue(), new Date());

    let user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      const userFactory = UserFactory.build({
        email: input.email,
        emailVerified: "",
        firstName: "",
        lastName: "",
        passwordHash: "",
      });
      user = await this.userRepository.create(userFactory);
    }

    const rawToken = await this.tokenGenerator.generate({ length: 32 });
    const tokenHash = await this.hashGenerator.hash(
      rawToken,
      AUTH_TOKEN_CONSTANTS.SESSION_TOKEN_SALT_ROUNDS,
    );
    const expiresAt = new Date(Date.now() + this.sessionTtlSeconds * 1000);

    const sessionFactory = SessionFactory.build({
      userId: user.id.getValue(),
      sessionToken: tokenHash,
      expires: expiresAt.toISOString(),
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    });

    const session = await this.sessionRepository.create(sessionFactory);

    return right({
      sessionToken: session.sessionToken,
      expiresAt,
      user,
    });
  }
}
