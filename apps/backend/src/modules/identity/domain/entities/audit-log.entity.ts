import { BaseEntity, IpAddressVO, Optional, UUIDVO } from "@repo/common";

export interface AuditLogProps {
  userId: UUIDVO | null;
  tenantId: UUIDVO | null;
  organizationId: UUIDVO | null;
  action: string;
  resource: string;
  resourceId: UUIDVO | null;
  ipAddress: IpAddressVO | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  createdAt?: Date;
}

export class AuditLogEntity extends BaseEntity<AuditLogProps> {
  get userId() {
    return this.props.userId;
  }

  get tenantId() {
    return this.props.tenantId;
  }

  get organizationId() {
    return this.props.organizationId;
  }

  get action() {
    return this.props.action;
  }

  get resource() {
    return this.props.resource;
  }

  get resourceId() {
    return this.props.resourceId;
  }

  get ipAddress() {
    return this.props.ipAddress;
  }

  get userAgent() {
    return this.props.userAgent;
  }

  get metadata() {
    return this.props.metadata;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  static create(
    props: Optional<
      AuditLogProps,
      | "userId"
      | "tenantId"
      | "organizationId"
      | "ipAddress"
      | "resourceId"
      | "userAgent"
      | "metadata"
      | "createdAt"
    >,
    id?: UUIDVO,
  ) {
    return new AuditLogEntity(
      {
        ...props,
        userId: props.userId || null,
        tenantId: props.tenantId || null,
        organizationId: props.organizationId || null,
        resourceId: props.resourceId || null,
        ipAddress: props.ipAddress || null,
        userAgent: props.userAgent || null,
        metadata: props.metadata || null,
        createdAt: props.createdAt || new Date(),
      },
      id,
    );
  }
}
