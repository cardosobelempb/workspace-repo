import axios, { AxiosInstance } from "axios";

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
export class AuthServiceClient {
  private readonly http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: process.env.AUTH_SERVICE_URL,
      timeout: 5000,
    });
  }

  /**
   * Envia credenciais para o auth-service e retorna tokens.
   *
   * @param input email e senha informados pelo usuário
   * @returns usuário autenticado, accessToken e refreshToken
   */
  async login(input: LoginInput): Promise<AuthResponse> {
    const response = await this.http.post<AuthResponse>("/auth/login", input);

    return response.data;
  }

  /**
   * Consulta o usuário autenticado no auth-service.
   *
   * Útil quando o backend prefere delegar a validação do token para o auth-service.
   */
  async me(accessToken: string): Promise<AuthUserResponse> {
    const response = await this.http.get<AuthUserResponse>("/auth/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data;
  }

  /**
   * Solicita renovação de tokens usando refresh token.
   */
  async refresh(refreshToken: string): Promise<AuthResponse> {
    const response = await this.http.post<AuthResponse>("/auth/refresh", {
      refreshToken,
    });

    return response.data;
  }

  /**
   * Solicita logout/revogação do refresh token.
   */
  async logout(refreshToken: string): Promise<void> {
    await this.http.post("/auth/logout", {
      refreshToken,
    });
  }
}
