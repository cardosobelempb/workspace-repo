import {
  BaseEntity,
  EmailVO,
  IpAddressVO,
  Optional,
  UserAgentVO,
  UUIDVO,
} from "@repo/common";

export interface OtpCodeProps {
  email: EmailVO;
  codeHash: string;
  purpose: string;
  attempts: number;
  maxAttempts: number;
  ipAddress: IpAddressVO | null;
  userAgent: UserAgentVO | null;
  expiredAt: Date;
  usedAt: Date | null;
  createdAt: Date;
  deletedAt: Date | null;
}

export class OtpCodeEntity extends BaseEntity<OtpCodeProps> {
  get email() {
    return this.props.email;
  }
  get codeHash() {
    return this.props.codeHash;
  }
  get purpose() {
    return this.props.purpose;
  }
  get attempts() {
    return this.props.attempts;
  }
  get maxAttempts() {
    return this.props.maxAttempts;
  }
  get expiredAt() {
    return this.props.expiredAt;
  }
  get usedAt() {
    return this.props.usedAt;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get deletedAt() {
    return this.props.deletedAt;
  }

  isExpired(): boolean {
    return new Date() > this.props.expiredAt;
  }

  markAsUsed(): void {
    this.props.usedAt = new Date();
  }

  incrementAttempts(): void {
    this.props.attempts += 1;
  }

  static create(
    props: Optional<
      OtpCodeProps,
      "ipAddress" | "usedAt" | "userAgent" | "createdAt" | "deletedAt"
    >,
    id?: UUIDVO,
  ) {
    return new OtpCodeEntity(
      {
        ...props,
        ipAddress: props.ipAddress ?? null,
        userAgent: props.userAgent ?? null,
        usedAt: props.usedAt ?? null,
        createdAt: props.createdAt ?? new Date(),
        deletedAt: props.deletedAt ?? null,
      },
      id,
    );
  }
}
