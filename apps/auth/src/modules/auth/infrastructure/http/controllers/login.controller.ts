import { envAuth } from "@/config/env-auth";
import { CreateSessionUseCase } from "@/modules/auth/application/usecases/create-session.usecase";
import { Controller, LoginDto, Post, right, Validate } from "@repo/common";
import { FastifyReply, FastifyRequest } from "fastify";
import { LoginSchema } from "../schemas/login.schema";

@Controller("/auth")
export class LoginController {
  static inject = [CreateSessionUseCase];

  constructor(private readonly createSessionUseCase: CreateSessionUseCase) {}

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
  @Validate({ body: LoginSchema })
  @Post("/login", {
    tags: ["Auth"],
    summary: "Login com sessão",
    description: "Valida credenciais, cria sessão e grava cookie httpOnly.",
    body: LoginSchema,
    responses: {
      200: { description: "Login realizado com sucesso" },
      401: { description: "Credenciais inválidas" },
    },
  })
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as LoginDto;

    const result = await this.createSessionUseCase.execute(body, {
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

    return reply.status(200).send(
      right({
        user: result.value.user,
        repfreshToken: result.value.refreshToken,
        accessToken: result.value.accessToken,
        expiresAt: result.value.expiresAt,
      }),
    );
  }
}
