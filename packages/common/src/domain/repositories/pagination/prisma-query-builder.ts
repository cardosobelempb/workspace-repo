// prisma-query-builder.ts

import { SearchFilter } from "./types/filter.types";

export class PrismaQueryBuilder {
  static buildWhere(filters?: SearchFilter[]) {
    if (!filters?.length) {
      return {};
    }

    return {
      AND: filters.map((filter) => this.parseFilter(filter)),
    };
  }

  private static parseFilter(filter: SearchFilter) {
    switch (filter.operator) {
      case "eq":
        return {
          [filter.field]: filter.value,
        };

      case "contains":
        return {
          [filter.field]: {
            contains: filter.value,
            mode: "insensitive",
          },
        };

      case "startsWith":
        return {
          [filter.field]: {
            startsWith: filter.value,
            mode: "insensitive",
          },
        };

      case "endsWith":
        return {
          [filter.field]: {
            endsWith: filter.value,
            mode: "insensitive",
          },
        };

      case "gt":
        return {
          [filter.field]: {
            gt: filter.value,
          },
        };

      case "gte":
        return {
          [filter.field]: {
            gte: filter.value,
          },
        };

      case "lt":
        return {
          [filter.field]: {
            lt: filter.value,
          },
        };

      case "lte":
        return {
          [filter.field]: {
            lte: filter.value,
          },
        };

      case "in":
        return {
          [filter.field]: {
            in: filter.value,
          },
        };

      default:
        return {};
    }
  }
}
