import { HttpClient } from "@/shared/http/clients/http-cliente.service";

export type AuthUserResponse = {
  id: string;
  email: string;
  emailVerified: Date | null;
};

export type AuthResponse = {
  user: AuthUserResponse;
  accessToken: string;
  refreshToken: string;
};

/**
 * Client HTTP responsável por comunicação entre backend e auth-service.
 *
 * Responsabilidade:
 * - Isolar chamadas HTTP externas.
 * - Evitar axios espalhado pelos use cases/controllers.
 * - Facilitar testes com mock deste client.
 */
export class AuthMeServiceClient {
  static inject = [HttpClient];
  constructor(private readonly http: HttpClient) {}

  /**
   * Consulta o usuário autenticado no auth-service.
   *
   * Útil quando o backend prefere delegar a validação do token para o auth-service.
   */
  async execute(accessToken: string): Promise<AuthUserResponse> {
    const response = await this.http.get<AuthUserResponse>("/auth/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data;
  }
}
