import { RootEntity } from "@/common/shared";
import { Optional } from "../types";
import { EmailVO, IpAddressVO, UserAgentVO, UUIDVO } from "../values-objects";

export interface OtpCodeProps {
  email: EmailVO;
  ipAddress: IpAddressVO | null;
  userAgent: UserAgentVO | null;
  codeHash: string;
  attempts: number;
  maxAttempts: number;
  purpose: string;
  createdAt: Date;
  expiredAt: Date;
  usedAt: Date | null;
  updatedAt: Date | null;
  deletedAt: Date | null;
}

export class OtpCodeEntity extends RootEntity<OtpCodeProps> {
  get email() {
    return this.props.email;
  }
  get ipAddress() {
    return this.props.ipAddress;
  }
  get userAgent() {
    return this.props.userAgent;
  }
  get purpose() {
    return this.props.purpose;
  }
  get maxAttempts() {
    return this.props.maxAttempts;
  }
  get codeHash() {
    return this.props.codeHash;
  }
  get attempts() {
    return this.props.attempts;
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
  get updatedAt() {
    return this.props.updatedAt;
  }
  get deletedAt() {
    return this.props.deletedAt;
  }

  isExpired(): boolean {
    return new Date() > this.props.expiredAt;
  }

  markAsUsed(): void {
    this.props.usedAt = new Date();
    this.touch();
  }

  incrementAttempts(): void {
    this.props.attempts += 1;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      OtpCodeProps,
      "attempts" | "maxAttempts" | "createdAt" | "updatedAt" | "deletedAt"
    >,
    id?: UUIDVO,
  ) {
    return new OtpCodeEntity(
      {
        ...props,
        attempts: props.attempts ?? 0,
        maxAttempts: props.maxAttempts ?? 5,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? null,
        deletedAt: props.deletedAt ?? null,
      },
      id,
    );
  }
}
