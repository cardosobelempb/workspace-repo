import { envAuth } from "@/config/env-auth";
import { LoginWithPasswordUseCase } from "@/modules/auth/application/usecases/login-with-password.usecase";
import {
  Controller,
  ErrorSchema,
  Post,
  UserSessionDto,
  UserSessionProjectionSchema,
  UserSessionSchema,
  Validate,
  ValidationErrorSchema,
} from "@repo/common";
import { FastifyReply, FastifyRequest } from "fastify";

@Controller("/auth")
export class LoginWithPasswordController {
  static inject = [LoginWithPasswordUseCase];

  constructor(private readonly loginWithPasswordUseCase: LoginWithPasswordUseCase) {}

  /**
   * Proxy de login.
   *
   * O frontend chama o backend.
   * O backend chama o auth-service.
   *
   * Vantagem:
   * - O frontend não precisa conhecer a URL interna do auth-service.
   * - O backend pode adicionar logs, rate limit, auditoria e headers.
   */
  @Validate({ body: UserSessionSchema })
  @Post("/login", {
    tags: ["Auth"],
    summary: "Login com sessão",
    description: "Valida credenciais, cria sessão e grava cookie httpOnly.",
    body: UserSessionSchema,
    responses: {
      200: {
        description: "Login realizado com sucesso",
        schema: UserSessionProjectionSchema,
      },
      400: { description: "Dados inválidos", schema: ValidationErrorSchema },
      401: { description: "Credenciais inválidas", schema: ErrorSchema },
      422: { description: "Erro de validação", schema: ValidationErrorSchema },
      500: { description: "Erro interno do servidor", schema: ErrorSchema },
    },
  })
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as UserSessionDto;

    const result = await this.loginWithPasswordUseCase.execute(body, {
      ipAddress: request.ip,
      userAgent: request.headers["user-agent"] ?? null,
    });

    if (result.isLeft()) {
      throw result.value;
    }

    const cookieName = envAuth.SESSION_COOKIE_NAME ?? "sid";
    const secure = envAuth.SESSION_COOKIE_SECURE === "true";

    reply.setCookie(cookieName, result.value.accessToken, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      expires: result.value.expiresAt,
    });

    return reply.status(200).send(result.value);
  }
}
