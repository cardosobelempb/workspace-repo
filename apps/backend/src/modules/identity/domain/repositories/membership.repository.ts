import { UUIDVO } from "@repo/common";
import { PrismaDatabase, PrismaRepository } from "@repo/database";
import { MembershipEntity } from "../entities/membership.entity";

export type FindActiveMembershipInput = {
  userId: UUIDVO;
  tenantId: UUIDVO;
  organizationId: UUIDVO;
};

/**
 * Contrato de acesso a memberships.
 *
 * O RBAC depende deste contrato para descobrir:
 * - Se o usuário pertence ao tenant.
 * - Qual role ele possui.
 * - Se a membership está ativa.
 */
export abstract class MembershipRepository extends PrismaRepository<MembershipEntity> {
  constructor(prisma: PrismaDatabase) {
    super(prisma);
  }
  abstract findActive(input: FindActiveMembershipInput): Promise<MembershipEntity | null>;
}
