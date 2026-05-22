import { BaseEntity, IpAddressVO, Optional, TokenType, UUIDVO } from "@repo/common";

export interface TokenProps {
  userId: UUIDVO;
  type: TokenType;
  valueHash: string;
  expiredAt: Date;
  ipAddress: IpAddressVO;
  userAgent: string;
  createdAt: Date;
  updatedAt: Date | null;
  deletedAt: Date | null;
  revokedAt: Date | null;
}

export class TokenEntity extends BaseEntity<TokenProps> {
  get userId(): UUIDVO {
    return this.props.userId;
  }

  get type(): TokenType {
    return this.props.type;
  }

  get valueHash(): string {
    return this.props.valueHash;
  }

  get expiredAt(): Date {
    return this.props.expiredAt;
  }

  get revokedAt(): Date | null {
    return this.props.revokedAt;
  }

  get ipAddress(): IpAddressVO {
    return this.props.ipAddress;
  }

  get userAgent(): string {
    return this.props.userAgent;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date | null {
    return this.props.updatedAt;
  }

  get deletedAt(): Date | null {
    return this.props.deletedAt;
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      TokenProps,
      "expiredAt" | "revokedAt" | "createdAt" | "updatedAt" | "deletedAt"
    >,
    id?: UUIDVO,
  ) {
    return new TokenEntity(
      {
        ...props,
        expiredAt: props.expiredAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
        revokedAt: props.revokedAt ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? null,
        deletedAt: props.deletedAt ?? null,
      },
      id,
    );
  }
}
