import { Page, SearchInput, TOKENS } from "@repo/common";
import { Prisma, PrismaDatabase, PrismaRepository } from "@repo/database";
import { UserEntity } from "../../domain/entities/user.entity";
import { UserPageRepository } from "../../domain/repositoties/user-page.repository";
import { PrismaUserMapper } from "../mappers/prisma-user.mapper";

export class PrismaUserPageRepository
  extends PrismaRepository
  implements UserPageRepository
{
  static inject = [TOKENS.PRISMA_CLIENT];

  constructor(prisma: PrismaDatabase) {
    super(prisma);
  }

  async page(params: SearchInput): Promise<Page<UserEntity>> {
    const page = params.page ?? 1;
    const perPage = params.perPage ?? 15;
    const filter = params.filter?.trim() ?? "";
    const sortDirection = params.sortDirection ?? "desc";
    const allowedSortBy = new Set<keyof Prisma.UserOrderByWithRelationInput>([
      "email",
      "createdAt",
      "updatedAt",
    ]);
    const sortBy =
      params.sortBy &&
      allowedSortBy.has(params.sortBy as keyof Prisma.UserOrderByWithRelationInput)
        ? params.sortBy
        : "createdAt";

    const where: Prisma.UserWhereInput = filter
      ? {
          OR: [{ email: { contains: filter, mode: "insensitive" } }],
        }
      : {};

    const [total, users] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: { [sortBy]: sortDirection },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);

    return {
      content: users.map(PrismaUserMapper.toDomain),
      pageable: {
        offset: (page - 1) * perPage,
        pageNumber: page,
        pageSize: perPage,
        sort: {
          sorted: !!params.sortBy,
          unsorted: !params.sortBy,
          empty: !params.sortBy,
        },

        paged: true,
        unpaged: false,
      },
      totalPages: Math.ceil(total / perPage),
      totalElements: total,
      last: page * perPage >= total,
      size: perPage,
      number: page,
      sort: {
        sorted: !!params.sortBy,
        unsorted: !params.sortBy,
        empty: !params.sortBy,
      },
      numberOfElements: users.length,
      first: page === 1,
      empty: users.length === 0,
    };
  }
}
