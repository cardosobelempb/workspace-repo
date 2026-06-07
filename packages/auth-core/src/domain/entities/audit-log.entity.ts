import {
  BaseAggregate,
  IpAddressVO,
  MetadataVO,
  Optional,
  UserAgentVO,
  UUIDVO,
} from "@repo/common";

export interface AuditLogProps {
  userId: UUIDVO | null;
  tenantId: UUIDVO | null;
  organizationId: UUIDVO | null;
  action: string;
  resource: string;
  resource_id: string;
  ipAddress: IpAddressVO | null;
  userAgent: UserAgentVO | null;
  metadata: MetadataVO | null;
  createdAt: Date;
}

export class AuditLogEntity extends BaseAggregate<AuditLogProps> {
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
  get resource_id() {
    return this.props.resource_id;
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
      | "userAgent"
      | "metadata"
      | "createdAt"
    >,
    id?: UUIDVO,
  ) {
    return new AuditLogEntity(
      {
        ...props,
        ipAddress: props.ipAddress ?? null,
        userAgent: props.userAgent ?? null,
        metadata: props.metadata ?? null,
        userId: props.userId ?? null,
        tenantId: props.tenantId ?? null,
        organizationId: props.organizationId ?? null,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}
