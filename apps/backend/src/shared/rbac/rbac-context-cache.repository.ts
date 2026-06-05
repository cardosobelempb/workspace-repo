import { CacheService } from "@repo/cache";
import { MembershipRole, Permission } from "@repo/common";

/**
 * Contexto RBAC resolvido para uma requisição autenticada.
 *
 * Esse objeto evita consultar o banco em toda rota protegida.
 */
export type RbacContext = {
  userId: string;
  tenantId: string;
  organizationId?: string;
  role: MembershipRole;
  permissions: Permission[];
};

/**
 * Cache de autorização RBAC.
 *
 * Responsabilidade:
 * - Guardar role e permissões resolvidas por usuário/tenant/organization.
 * - Reduzir consultas repetidas no PostgreSQL.
 * - Permitir invalidação quando membership/role mudar.
 */
export class RbacContextCacheRepository {
  constructor(private readonly redis: CacheService) {}

  private key(input: {
    userId: string;
    tenantId: string;
    organizationId?: string;
  }): string {
    const organization = input.organizationId ?? "tenant";

    return `rbac:${input.userId}:${input.tenantId}:${organization}`;
  }

  async get(input: {
    userId: string;
    tenantId: string;
    organizationId?: string;
  }): Promise<RbacContext | null> {
    const raw = await this.redis.get(this.key(input));

    if (!raw || typeof raw !== "string") return null;

    return JSON.parse(raw) as RbacContext;
  }

  async set(context: RbacContext): Promise<void> {
    /**
     * TTL curto por segurança.
     *
     * Justificativa:
     * - Reduz carga no banco.
     * - Mas evita permissões antigas por muito tempo.
     * - Alterações críticas devem invalidar cache manualmente.
     */
    const ttlSeconds = 60 * 5;

    await this.redis.set(
      this.key({
        userId: context.userId,
        tenantId: context.tenantId,
        organizationId: context.organizationId,
      }),
      JSON.stringify(context),
      ttlSeconds,
    );
  }

  async delete(input: {
    userId: string;
    tenantId: string;
    organizationId?: string;
  }): Promise<void> {
    await this.redis.delete(this.key(input));
  }
}
