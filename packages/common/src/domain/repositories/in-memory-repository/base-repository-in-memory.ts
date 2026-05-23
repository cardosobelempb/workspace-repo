import { NotFoundError } from "../../errors/usecases/not-found.error";
import { UUIDVO } from "../../values-objects/uuid/uuid.vo";
import { SearchInput } from "../search.repository";
import { Page } from "../pagination/types/pagination.types";

export type ModelProps = {
  id?: UUIDVO;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  [key: string]: any;
};

export type CreateProps<Entity> = Partial<
  Omit<Entity, "id" | "createdAt" | "updatedAt" | "deletedAt">
>;

export abstract class BaseInMemoryRepository<Entity extends ModelProps> {
  protected items: Entity[] = [];
  protected sortableFields: (keyof Entity)[] = [];

  async findById(id: string): Promise<Entity | null> {
    try {
      return await this._get(id);
    } catch {
      return null;
    }
  }

  async create(entity: Entity): Promise<Entity> {
    return {
      id: UUIDVO.create(),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      ...entity,
    } as Entity;
  }

  async save(entity: Entity): Promise<Entity> {
    if (!entity.id) {
      entity.id = UUIDVO.create();
      entity.createdAt = new Date();
    }

    const index = this.items.findIndex((item) => item.id?.equals(entity.id));

    if (index === -1) {
      this.items.push(entity);
    } else {
      this.items[index] = entity;
    }

    return entity;
  }

  async delete(entity: Entity): Promise<void> {
    await this._get(entity.id?.getValue());
    const index = this.items.findIndex((item) => item.id === entity.id);
    this.items.splice(index, 1);
  }

  async page(params: SearchInput): Promise<Page<Entity>> {
    const page = params.page ?? 1;
    const perPage = params.perPage ?? 15;
    const sortBy = params.sortBy ?? "";
    const sortDirection = params.sortDirection ?? "asc";
    const filter = params.filter ?? "";

    const filteredItems = await this.applyFilter(this.items, filter);
    const orderedItems = this.applySort(filteredItems, sortBy, sortDirection);
    const paginatedItems = await this.applyPagination(orderedItems, page, perPage);

    return {
      content: paginatedItems,
      pageable: {
        offset: (page - 1) * perPage,
        pageNumber: page,
        pageSize: perPage,
        paged: true,
        unpaged: false,
        sort: {
          sorted: !!sortBy,
          unsorted: !sortBy,
          empty: !sortBy,
        },
      },
      totalPages: Math.ceil(filteredItems.length / perPage),
      totalElements: filteredItems.length,
      last: page * perPage >= filteredItems.length,
      size: perPage,
      number: page,
      sort: {
        sorted: !!sortBy,
        unsorted: !sortBy,
        empty: !sortBy,
      },
      numberOfElements: paginatedItems.length,
      first: page === 1,
      empty: paginatedItems.length === 0,
    };
  }

  async findManyByIds(ids: string[]): Promise<Entity[]> {
    return this.items.filter(
      (item) => item.id && ids.includes(item.id.getValue()) && !item.deletedAt,
    );
  }

  async exists(id: string): Promise<boolean> {
    const entity = this.items.find(
      (item) => item.id?.getValue() === id && !item.deletedAt,
    );
    return !!entity;
  }

  protected async _get(id: string | undefined): Promise<Entity> {
    const entity = this.items.find(
      (item) => item.id?.getValue() === id && !item.deletedAt,
    );

    if (!entity) {
      throw new NotFoundError({
        fieldName: "id",
        message: `Entity not found using id ${id}`,
      });
    }

    return entity;
  }

  protected abstract applyFilter(items: Entity[], filter?: string): Promise<Entity[]>;

  protected applySort(
    items: Entity[],
    sortBy?: keyof Entity,
    sortDirection: "asc" | "desc" = "asc",
  ): Entity[] {
    if (!sortBy || !this.sortableFields.includes(sortBy)) return items;

    return [...items].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (aValue == null) return 1;
      if (bValue == null) return -1;

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "desc"
          ? bValue.localeCompare(aValue)
          : aValue.localeCompare(bValue);
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "desc" ? bValue - aValue : aValue - bValue;
      }

      return 0;
    });
  }

  protected async applyPagination(
    items: Entity[],
    page: number = 1,
    perPage: number = 10,
  ): Promise<Entity[]> {
    const start = (page - 1) * perPage;
    const end = start + perPage;
    return items.slice(start, end);
  }
}
