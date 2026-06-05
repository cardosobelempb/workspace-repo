import { HttpClient } from "@/shared/http/clients/http-cliente.service";

export type LoginInput = {
  email: string;
  password: string;
};

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
export class AuthLoginServiceClient {
  static inject = [HttpClient];

  constructor(private readonly http: HttpClient) {}

  /**
   * Envia credenciais para o auth-service e retorna tokens.
   *
   * @param input email e senha informados pelo usuário
   * @returns usuário autenticado, accessToken e refreshToken
   */
  async execute(input: LoginInput): Promise<AuthResponse> {
    const response = await this.http.post<AuthResponse>("/auth/login", input);

    return response.data;
  }
}
