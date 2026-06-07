/*
export class CachedUserRepository extends UserRepository {
  constructor(
    private readonly repository: UserRepository,
    private readonly cache: CacheService,
  ) {
    super(repository.prisma);
  }

  // =========================================================
  // Find By Id
  // =========================================================

  async findById(id: string): Promise<UserEntity | null> {
    const key = CacheKeyFactory.userById(id);

    const cached = await this.cache.get<UserEntity>(key);

    if (cached) {
      return cached;
    }

    const user = await this.repository.findById(id);

    if (user) {
      await this.cache.set(key, user, 300);
    }

    return user;
  }

  // =========================================================
  // Find By Email
  // =========================================================

  async findByEmail(email: string): Promise<UserEntity | null> {
    const key = CacheKeyFactory.userByEmail(email);

    const cached = await this.cache.get<UserEntity>(key);

    if (cached) {
      return cached;
    }

    const user = await this.repository.findByEmail(email);

    if (user) {
      await this.cache.set(key, user, 180);
    }

    return user;
  }

  // =========================================================
  // Create
  // =========================================================

  async create(entity: UserEntity): Promise<UserEntity> {
    const user = await this.repository.create(entity);

    await this.invalidate(user);

    return user;
  }

  // =========================================================
  // Save
  // =========================================================

  async save(entity: UserEntity): Promise<UserEntity> {
    const user = await this.repository.save(entity);

    await this.invalidate(user);

    return user;
  }

  // =========================================================
  // Delete
  // =========================================================

  async delete(entity: UserEntity): Promise<void> {
    await this.repository.delete(entity);

    await this.invalidate(entity);
  }

  // =========================================================
  // Invalidate
  // =========================================================

  private async invalidate(user: UserEntity): Promise<void> {
    await Promise.all([
      this.cache.delete(CacheKeyFactory.userById(user.id.getValue())),

      this.cache.delete(CacheKeyFactory.userByEmail(user.email.getValue().value)),

      this.cache.deleteByPrefix(CacheKeyFactory.usersPrefix()),
    ]);
  }
}
*/

/**
 * Exemplo de implementação de um repositório de usuários com cache. Ele estende o repositório original e adiciona lógica para armazenar e recuperar dados do cache, além de invalidar o cache quando os dados são modificados.
 */
