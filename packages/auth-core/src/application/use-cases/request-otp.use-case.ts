import { AUTH_TOKEN_CONSTANTS } from "@/common/constants";
import { OtpCodeRepository } from "@/common/domain";
import {
  Either,
  HashGenerator,
  NotificationChannel,
  right,
  TokenGenerator,
} from "@repo/common";
import { NodemailerEmailAdapter } from "@repo/notification-email";

import { OtpCodeFactory } from "../factories";

export type RequestOtpInput = {
  email: string;
  purpose: string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type RequestOtpOutput = void;
export type RequestOtpError = never;

export class RequestOtpUseCase {
  constructor(
    private readonly otpRepository: OtpCodeRepository,
    private readonly nodemailerEmailAdapter: NodemailerEmailAdapter,
    private readonly tokenGenerator: TokenGenerator<{ length: number; charset: string }>,
    private readonly hashGenerator: HashGenerator,
    private readonly expiresInMinutes: number = 10,
  ) {}

  async execute(
    input: RequestOtpInput,
  ): Promise<Either<RequestOtpError, RequestOtpOutput>> {
    await this.otpRepository.invalidateAllByEmailAndPurpose(input.email, input.purpose);

    const code = await this.tokenGenerator.generate({ length: 6, charset: "numeric" });
    const codeHash = await this.hashGenerator.hash(
      code,
      AUTH_TOKEN_CONSTANTS.SESSION_TOKEN_SALT_ROUNDS,
    );
    const expiresAt = new Date(Date.now() + this.expiresInMinutes * 60 * 1000);

    const otpFactory = OtpCodeFactory.build({
      email: input.email,
      codeHash,
      purpose: input.purpose,
      attempts: 0,
      maxAttempts: 5,
      expiredAt: expiresAt.toISOString(),
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      usedAt: null,
    });

    await this.otpRepository.create(otpFactory);

    await this.nodemailerEmailAdapter.send({
      to: input.email,
      subject: "Seu código de acesso",
      html: `<p>Seu código é: <strong>${code}</strong></p><p>Expira em ${this.expiresInMinutes} minutos.</p>`,
      content: `Seu código é: ${code}. Expira em ${this.expiresInMinutes} minutos.`,
      channel: NotificationChannel.EMAIL,
      metadata: { email: input.email, purpose: input.purpose },
    });

    return right(undefined);
  }
}
