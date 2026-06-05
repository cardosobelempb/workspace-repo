import { RegisterUseCase } from "@/modules/auth/application/usecases/register.usecase";
import { UserRegisterDto } from "@/modules/user/application/dto/user.dto";
import {
  UserProjectionSchema,
  UserRegisterSchema,
} from "@/modules/user/infrastructure/http/schemas/user.schema";
import { Controller, Post, Validate } from "@repo/common";
import { FastifyReply, FastifyRequest } from "fastify";

@Controller("/auth")
export class RegisterController {
  static inject = [RegisterUseCase];

  constructor(private readonly registerUseCase: RegisterUseCase) {}

  @Validate({ body: UserRegisterSchema })
  @Post("/register", {
    tags: ["Auth"],
    summary: "Registra um novo usuário",
    description: "Cria uma nova conta de usuário no auth-service.",
    body: UserRegisterSchema,
    responses: {
      201: {
        description: "Usuário registrado com sucesso",
        schema: UserProjectionSchema,
      },
      409: {
        description: "E-mail já cadastrado",
      },
    },
  })
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as UserRegisterDto;

    const result = await this.registerUseCase.execute(body);

    if (result.isLeft()) {
      throw result.value;
    }

    return reply.status(201).send(result.value);
  }
}
