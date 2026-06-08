// packages/auth-core/src/application/use-cases/request-magic-link.use-case.ts

import { AUTH_TOKEN_CONSTANTS } from "@/common/constants";
import { Either, HashGenerator, right, TokenGenerator } from "@repo/common";
import { NodemailerEmailAdapter } from "@repo/notification-email";
import { NotificationChannel } from "../../../../notifications-core/dist";
import { MagicLinkRepository } from "../../domain/repositories/magic-link.repository";
import { MagicLinkTokenFactory } from "../factories";

export type RequestMagicLinkInput = {
  email: string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export class RequestMagicLinkUseCase {
  constructor(
    private readonly magicLinkRepository: MagicLinkRepository,
    private readonly nodemailerEmailAdapter: NodemailerEmailAdapter,
    private readonly tokenGenerator: TokenGenerator<{ length: number }>,
    private readonly hashGenerator: HashGenerator,
    private readonly frontendUrl: string,
    private readonly expiresInMinutes: number = 15,
  ) {}

  async execute(input: RequestMagicLinkInput): Promise<Either<never, void>> {
    await this.magicLinkRepository.invalidateAllByEmail(input.email);

    const rawToken = await this.tokenGenerator.generate({ length: 32 });
    const tokenHash = await this.hashGenerator.hash(
      rawToken,
      AUTH_TOKEN_CONSTANTS.SESSION_TOKEN_SALT_ROUNDS,
    );
    const expiresAt = new Date(Date.now() + this.expiresInMinutes * 60 * 1000);

    const magicLinkFactory = MagicLinkTokenFactory.build({
      email: input.email,
      tokenHash,
      expiresAt: expiresAt.toISOString(),
      ipAddress: input.ipAddress ?? "",
      userAgent: input.userAgent ?? "",
      usedAt: null,
    });

    await this.magicLinkRepository.create(magicLinkFactory);

    const link = `${this.frontendUrl}/auth/magic-link/verify?token=${rawToken}`;

    await this.nodemailerEmailAdapter.send({
      to: input.email,
      subject: "Seu link de acesso",
      html: `<p><a href="${link}">Clique aqui para entrar</a></p><p>O link expira em ${this.expiresInMinutes} minutos.</p>`,
      content: `Acesse: ${link}. Expira em ${this.expiresInMinutes} minutos.`,
      channel: NotificationChannel.EMAIL,
      metadata: { email: input.email },
    });

    return right(undefined);
  }
}
