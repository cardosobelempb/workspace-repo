// page-request.ts

import { SearchFilter } from "./types/filter.types";

export interface PageInput {
  /**
   * Spring usa ZERO-BASED
   *
   * page=0 → primeira página
   */
  page?: number;

  /**
   * Spring usa size
   */
  size?: number;

  /**
   * Formato Spring:
   *
   * sort=name,asc
   * sort=createdAt,desc
   */
  sort?: string;

  /**
   * Filtro textual simples
   */
  filter?: string;

  /**
   * Filtros avançados
   */
  filters?: SearchFilter[];
}
