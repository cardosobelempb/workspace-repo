// page.mapper.ts
import { Page } from "./types/pagination.types";

interface ToPageInput<TData, TResult> {
  data: TData[];
  total: number;
  page: number;
  size: number;
  mapper: (item: TData) => TResult;
  sorted?: boolean;
}

export class PageMapper {
  static toPage<TData, TResult>({
    data,
    total,
    page,
    size,
    mapper,
    sorted = false,
  }: ToPageInput<TData, TResult>): Page<TResult> {
    const offset = page * size;

    return {
      content: data.map(mapper),

      pageable: {
        offset,
        pageNumber: page,
        pageSize: size,

        paged: true,
        unpaged: false,

        sort: {
          sorted,
          unsorted: !sorted,
          empty: !sorted,
        },
      },

      totalPages: Math.ceil(total / size),

      totalElements: total,

      last: page >= Math.ceil(total / size) - 1,

      size,

      number: page,

      sort: {
        sorted,
        unsorted: !sorted,
        empty: !sorted,
      },

      numberOfElements: data.length,

      first: page === 0,

      empty: data.length === 0,
    };
  }
}
