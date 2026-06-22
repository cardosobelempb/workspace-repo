import { RegisterUseCase } from "@/modules/auth/application/usecases/register.usecase";
import {
  Controller,
  ErrorSchema,
  Post,
  UserRegisterDto,
  UserRegisterProjectionSchema,
  UserRegisterSchema,
  Validate,
  ValidationErrorSchema,
} from "@repo/common";
import { FastifyReply, FastifyRequest } from "fastify";

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
    body: UserRegisterSchema,
    responses: {
      201: {
        description: "Usuário registrado com sucesso",
        schema: UserRegisterProjectionSchema,
      },
      400: { description: "Dados inválidos", schema: ValidationErrorSchema },
      409: { description: "E-mail já cadastrado", schema: ErrorSchema },
      422: { description: "Erro de validação", schema: ValidationErrorSchema },
      500: { description: "Erro interno do servidor", schema: ErrorSchema },
    },
  })
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as UserRegisterDto;

    const result = await this.registerUseCase.execute(body);

    return reply.status(201).send(result.value);
  }
}
