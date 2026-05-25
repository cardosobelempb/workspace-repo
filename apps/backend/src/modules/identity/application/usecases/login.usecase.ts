import { Either, left, right, UnexpectedError } from "@repo/common";

import { HttpClient } from "@/shared/http/clients/http-cliente.service";
import { LoginDto } from "../dto/login.dto";

// ============================================================
// Tipos de resposta
// ============================================================

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

// ============================================================
// Response do use case
// ============================================================

export type LoginUseCaseResponse = Either<UnexpectedError, AuthResponse>;

// ============================================================
// LoginUseCase
// Responsabilidade:
// - Encapsular chamada do auth-service
// - Centralizar tratamento de erro
// - Desacoplar controller do HTTP client
// - Facilitar testes
// ============================================================

export class LoginUseCase {
  static inject = [HttpClient];

  constructor(private readonly httpClient: HttpClient) {}

  /**
   * Executa login via auth-service.
   *
   * Fluxo:
   * 1. Envia email/senha
   * 2. Auth-service valida
   * 3. Retorna sessão/tokens
   */
  async execute(input: LoginDto): Promise<LoginUseCaseResponse> {
    const response = await this.httpClient.post<AuthResponse>("/auth/login", input);

    /**
     * Aqui você pode:
     * - mapear erros HTTP
     * - transformar 401 em UnauthorizedError
     * - adicionar logs
     * - auditoria
     */

    if (response.status !== 200) {
      return left(
        new UnexpectedError({
          fieldName: "login",
          message: "Erro inesperado ao realizar login",
        }),
      );
    }

    return right(response.data);
  }
}
