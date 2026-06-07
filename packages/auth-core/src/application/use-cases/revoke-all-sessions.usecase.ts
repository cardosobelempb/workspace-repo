import { AUTH_DI_TOKENS } from "../../constants";
import { SessionRepository } from "../../domain/repositories/session.repository";

export class RevokeAllSessionsUseCase {
  static inject = [AUTH_DI_TOKENS.SESSION_REPOSITORY];

  constructor(private readonly sessions: SessionRepository) {}

  async execute(userId: string): Promise<void> {
    await this.sessions.revokeAllByUserId(userId);
  }
}
