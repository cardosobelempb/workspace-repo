import { Page, PageInput, TOKENS } from "@repo/common";
import { Prisma, PrismaDatabase, PrismaPageRepository } from "@repo/database";
import { UserEntity } from "@/modules/user/domain/entities/user.entity";
import { UserPageRepository } from "@/modules/user/domain/repositoties/user-page.repository";
import { PrismaUserMapper } from "@/modules/user/infrastructure/mappers/prisma-user.mapper";

type PrismaUserModel = Prisma.UserGetPayload<object>;

export class PrismaUserPageRepository
  extends PrismaPageRepository
  implements UserPageRepository
{
  static inject = [TOKENS.PRISMA_CLIENT];

  constructor(prisma: PrismaDatabase) {
    super(prisma);
  }

  page(params: PageInput): Promise<Page<UserEntity>> {
    return this.paginate<
      PrismaUserModel,
      UserEntity,
      Prisma.UserWhereInput,
      Prisma.UserOrderByWithRelationInput
    >({
      params,
      delegate: this.prisma.user,
      mapper: PrismaUserMapper.toDomain,
      allowedSortFields: ["email", "createdAt", "updatedAt"],
      defaultSortField: "createdAt",
      buildWhere: this.buildWhere,
    });
  }

  private buildWhere(params: PageInput): Prisma.UserWhereInput {
    const filter = params.filter?.trim();

    if (!filter) return {};

    return {
      OR: [
        {
          email: {
            contains: filter,
            mode: "insensitive",
          },
        },
      ],
    };
  }
}
