/**
 * Estrutura padrão dos tokens JWT gerados pela aplicação.
 */
export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Contrato abstrato para provedores de autenticação via JWT.
 *
 * Define métodos essenciais para criação, verificação e decodificação
 * de tokens de acesso (accessToken) e atualização (refreshToken).
 *
 * @template T - Tipo do payload contido no token (ex: { userId: string }).
 */
export abstract class TokenGenerator<T extends object> {
  /**
   * Gera um generate a partir do payload.
   * @param payload - Informações a serem assinadas no token.
   * @returns generate como string.
   */
  // abstract generate(): string;
  // abstract generate(): Promise<string>;
  // abstract generate(payload: T): string;
  abstract generate(payload: T): Promise<string>;

  /**
   * Gera accessToken e refreshToken simultaneamente.
   * @param payload - Informações a serem assinadas nos tokens.
   * @returns Objeto com accessToken e refreshToken.
   */
  abstract all(payload: T): Tokens;

  /**
   * Valida um accessToken e retorna o payload se for válido.
   * @param token - Token JWT recebido do cliente.
   * @returns Payload extraído ou null se inválido.
   */
  abstract verify(token: string): T | null;

  /**
   * Verifica se o token é válido (sem retornar o payload).
   * @param token - Token JWT de acesso.
   * @returns True se válido, false se inválido.
   */
  abstract isValid(token: string): boolean;

  /**
   * Decodifica o accessToken e extrai o payload, mesmo que o token esteja expirado.
   * @param token - Token JWT de acesso.
   * @returns Payload extraído ou null se inválido.
   */
  abstract decode(token: string): T | null;
}
