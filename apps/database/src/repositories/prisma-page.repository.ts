import { Page, PageInput, PageMapper, SortParser } from "@repo/common";
import { PrismaDatabase } from "../prisma-client";

interface Delegate<TModel, TWhere, TOrderBy> {
  count(args: { where?: TWhere }): Promise<number>;

  findMany(args: {
    where?: TWhere;
    orderBy?: TOrderBy;
    skip?: number;
    take?: number;
  }): Promise<TModel[]>;
}

interface PaginateInput<TModel, TResult, TWhere, TOrderBy> {
  params: PageInput;
  delegate: Delegate<TModel, TWhere, TOrderBy>;
  mapper: (model: TModel) => TResult;
  allowedSortFields: string[];
  defaultSortField: string;
  buildWhere?: (params: PageInput) => TWhere;
}

export abstract class PrismaPageRepository {
  constructor(protected readonly prisma: PrismaDatabase) {}

  protected async paginate<TModel, TResult, TWhere, TOrderBy>({
    params,
    delegate,
    mapper,
    allowedSortFields,
    defaultSortField,
    buildWhere,
  }: PaginateInput<TModel, TResult, TWhere, TOrderBy>): Promise<Page<TResult>> {
    const page = Math.max(params.page ?? 0, 0);
    const size = Math.max(params.size ?? 20, 1);

    const parsedSort = SortParser.parse(params.sort);

    const sortField =
      parsedSort?.field && allowedSortFields.includes(parsedSort.field)
        ? parsedSort.field
        : defaultSortField;

    const direction = parsedSort?.direction ?? "desc";

    const where = buildWhere?.(params);

    const orderBy = {
      [sortField]: direction,
    } as TOrderBy;

    const skip = page * size;

    const [total, data] = await this.prisma.$transaction(async () => {
      const total = await delegate.count({ where });

      const data = await delegate.findMany({
        where,
        orderBy,
        skip,
        take: size,
      });

      return [total, data] as const;
    });

    return PageMapper.toPage({
      data,
      total,
      page,
      size,
      mapper,
      sorted: Boolean(orderBy),
    });
  }
}
