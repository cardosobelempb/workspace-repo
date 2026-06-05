import { HttpClient } from "@/shared/http/clients/http-cliente.service";

/**
 * Client HTTP responsável por comunicação entre backend e auth-service.
 *
 * Responsabilidade:
 * - Isolar chamadas HTTP externas.
 * - Evitar axios espalhado pelos use cases/controllers.
 * - Facilitar testes com mock deste client.
 */
export class AuthLogountServiceClient {
  static inject = [HttpClient];
  constructor(private readonly http: HttpClient) {}
  /**
   * Solicita logout/revogação do refresh token.
   */
  async execute(refreshToken: string): Promise<void> {
    await this.http.post("/auth/logout", {
      refreshToken,
    });
  }
}
