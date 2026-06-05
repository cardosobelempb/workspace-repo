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
export class AuthRefleshServiceClient {
  static inject = [HttpClient];
  constructor(private readonly http: HttpClient) {}

  /**
   * Solicita renovação de tokens usando refresh token.
   */
  async execute(refreshToken: string): Promise<AuthResponse> {
    const response = await this.http.post<AuthResponse>("/auth/refresh", {
      refreshToken,
    });

    return response.data;
  }
}
