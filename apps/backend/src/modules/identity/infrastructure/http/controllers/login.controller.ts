import { LoginDto } from "@/modules/identity/application/dto/login.dto";
import { LoginUseCase } from "@/modules/identity/application/usecases/login.usecase";
import { LoginSchema } from "@/modules/identity/infrastructure/http/schemas/login.schema";
import { Controller, Post, right, Validate } from "@repo/common";
import { FastifyReply, FastifyRequest } from "fastify";

@Controller("/auth")
export class LoginController {
  static inject = [LoginUseCase];

  constructor(private readonly loginUseCase: LoginUseCase) {}

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
    summary: "Realiza login do usuário",
    description: "Encaminha as credenciais para o auth-service e retorna tokens.",
    body: LoginSchema,
    responses: {
      200: { description: "Login realizado com sucesso" },
      401: { description: "Credenciais inválidas" },
    },
  })
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as LoginDto;

    const result = await this.loginUseCase.execute(body);

    if (result.isLeft()) {
      throw result.value;
    }

    return reply.status(200).send(right(result.value));
  }
}
