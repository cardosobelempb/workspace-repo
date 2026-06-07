import {
  BaseAggregate,
  EmailVO,
  IpAddressVO,
  Optional,
  UserAgentVO,
  UUIDVO,
} from "@repo/common";

export interface MagicLinkTokenProps {
  email: EmailVO;
  tokenHash: string;
  ipAddress: IpAddressVO;
  userAgent: UserAgentVO;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
  deletedAt: Date | null;
}

export class MagicLinkTokenEntity extends BaseAggregate<MagicLinkTokenProps> {
  get email() {
    return this.props.email;
  }
  get tokenHash() {
    return this.props.tokenHash;
  }
  get ipAddress() {
    return this.props.ipAddress;
  }
  get userAgent() {
    return this.props.userAgent;
  }
  get expiresAt() {
    return this.props.expiresAt;
  }
  get usedAt() {
    return this.props.usedAt;
  }

  markAsUsed(): void {
    if (!this.isUsed()) {
      this.props.usedAt = new Date();
    }
  }

  isUsed(): boolean {
    return this.props.usedAt !== null;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get deletedAt() {
    return this.props.deletedAt;
  }

  isDeleted(): boolean {
    return this.props.deletedAt !== null;
  }

  static create(
    props: Optional<MagicLinkTokenProps, "createdAt" | "deletedAt">,
    id?: UUIDVO,
  ) {
    return new MagicLinkTokenEntity(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
        deletedAt: props.deletedAt ?? null,
      },
      id,
    );
  }
}
