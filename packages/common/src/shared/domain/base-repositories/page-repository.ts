// domain/repositories/page-repository.ts

import { PageInput } from "./pagination";
import { Page } from "./pagination/types/pagination.types";

/**
 * Estende BaseRepository com suporte à busca paginada,
 * seguindo o contrato do Spring Data Page<T>.
 *
 * ✅ NÃO redeclara `prisma` — herdado via cadeia BaseRepository → PrismaRepository
 * ✅ NÃO repete construtor
 *
 * @template TEntity - Entidade de domínio gerenciada
 *
 * @example
 * const result = await userRepo.page({ page: 0, size: 10, sort: 'name,asc' });
 * result.content        // UserEntity[]
 * result.totalElements  // 48
 * result.totalPages     // 5
 * result.first          // true
 */
export abstract class PageRepository<TEntity> {
  // ✅ Sem redeclaração de `prisma`
  // ✅ Sem construtor duplicado

  /**
   * Busca entidades de forma paginada.
   * @param params - Critérios de paginação e ordenação
   */
  abstract page(params: PageInput): Promise<Page<TEntity>>;
}
