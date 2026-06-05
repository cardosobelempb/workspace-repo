import { RegisterDto } from "@/modules/auth/application/dto/register.dto";
import { RegisterUseCase } from "@/modules/auth/application/usecases/register.usecase";
import { UserRegisterSchema } from "@/modules/user/infrastructure/http/schemas/user.schema";
import { Controller, Post, Validate } from "@repo/common";
import { FastifyReply, FastifyRequest } from "fastify";
import { RegisterBodySchema } from "../schemas/register.schema";

@Controller("/auth")
export class RegisterController {
  static inject = [RegisterUseCase];

  constructor(private readonly registerUseCase: RegisterUseCase) {}

  @Validate({ body: UserRegisterSchema })
  @Post("/register", {
    tags: ["Auth"],
    summary: "Registrar um novo usuário",
    description:
      "Registra um novo usuário com e-mail, senha e perfil. Retorna os dados do usuário criado.",
    body: RegisterBodySchema,
    responses: {
      201: {
        description: "Usuário registrado com sucesso",
        schema: RegisterBodySchema,
      },
      409: {
        description: "Conflito - E-mail já cadastrado",
      },
    },
  })
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as RegisterDto;

    const result = await this.registerUseCase.execute(body);

    if (result.isLeft()) {
      throw result.value;
    }

    return reply.status(201).send(result.value);
  }
}
