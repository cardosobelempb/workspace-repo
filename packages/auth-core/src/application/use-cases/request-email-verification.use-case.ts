import { AUTH_TOKEN_CONSTANTS } from "@/common/constants";
import { EmailVerificationTokenRepository } from "@/common/domain";
import { Either, HashGenerator, right, TokenGenerator } from "@repo/common";
import { NodemailerEmailAdapter } from "@repo/notification-email";
import { NotificationChannel } from "../../../../notifications-core/dist";
import { EmailVerificationTokenFactory } from "../factories";

export type RequestEmailVerificationInput = {
  userId: string;
  email: string;
};

export class RequestEmailVerificationUseCase {
  constructor(
    private readonly emailVerificationRepository: EmailVerificationTokenRepository,
    private readonly nodemailerEmailAdapter: NodemailerEmailAdapter,
    private readonly hashGenerator: HashGenerator,
    private readonly tokenGenerator: TokenGenerator<{ length: number }>,
    private readonly frontendUrl: string,
    private readonly expiresInHours: number = 24,
  ) {}

  async execute(input: RequestEmailVerificationInput): Promise<Either<never, void>> {
    await this.emailVerificationRepository.invalidateAllByUserId(input.userId);

    const rawToken = await this.tokenGenerator.generate({ length: 32 });
    const tokenHash = await this.hashGenerator.hash(
      rawToken,
      AUTH_TOKEN_CONSTANTS.SESSION_TOKEN_SALT_ROUNDS,
    );
    const expiresAt = new Date(Date.now() + this.expiresInHours * 60 * 60 * 1000);

    const userFactory = EmailVerificationTokenFactory.build({
      userId: input.userId,
      tokenHash,
      expiresAt: expiresAt.toISOString(),
      usedAt: null,
    });

    await this.emailVerificationRepository.create(userFactory);

    const link = `${this.frontendUrl}/auth/verify-email?token=${rawToken}`;

    await this.nodemailerEmailAdapter.send({
      to: input.email,
      subject: "Confirme seu e-mail",
      html: `<p><a href="${link}">Clique aqui para confirmar seu e-mail</a></p><p>O link expira em ${this.expiresInHours} horas.</p>`,
      content: `Confirme seu e-mail: ${link}`,
      channel: NotificationChannel.EMAIL,
      metadata: { userId: input.userId },
    });

    return right(undefined);
  }
}
