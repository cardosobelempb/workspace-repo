/**
 * Factory responsável por criar entidades válidas.
 */
export abstract class BuildEntity<TEntity, CreateProps> {
  abstract create(props: CreateProps): TEntity;
}
