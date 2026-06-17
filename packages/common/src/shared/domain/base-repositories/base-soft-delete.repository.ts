import { BaseSoftDeletableRepository } from "./base-soft-deletable.repository";
import { RootRepository } from "./root.repository";

/**
 * Repositório com suporte a soft delete.
 */
export abstract class BaseSoftDeleteRepository<
  TEntity extends BaseSoftDeletableRepository,
> extends RootRepository<TEntity> {
  /**
   * Realiza exclusão lógica da entidade.
   */
  async softDelete(entity: TEntity): Promise<void> {
    entity.deletedAt = new Date();
    await this.save(entity);
  }

  /**
   * Restaura uma entidade excluída logicamente.
   */
  async restore(entity: TEntity): Promise<void> {
    entity.deletedAt = null;
    await this.save(entity);
  }
}
