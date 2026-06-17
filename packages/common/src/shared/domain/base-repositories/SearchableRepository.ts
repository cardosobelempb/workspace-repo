import { RootRepository } from "./root.repository";
import { SearchInput, SearchOutput } from "./search.repository";

/**
 * Extensão opcional para repositórios que suportam busca paginada.
 */
export abstract class SearchableRepository<TEntity> extends RootRepository<TEntity> {
  /**
   * Busca entidades de forma paginada.
   *
   * @param params Parâmetros de busca
   */
  abstract search(params: SearchInput): Promise<SearchOutput<TEntity>>;
}
