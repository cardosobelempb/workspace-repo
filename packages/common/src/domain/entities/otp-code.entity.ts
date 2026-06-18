import { RootEntity } from "@/common/shared";
import { Optional } from "../types";
import { PhoneVO, UUIDVO } from "../values-objects";

export interface OtpCodeProps {
  userId: UUIDVO;
  phone: PhoneVO;
  codeHash: string;
  attempts: number;
  createdAt: Date;
  expiredAt: Date;
  usedAt: Date | null;
  updatedAt: Date | null;
  deletedAt: Date | null;
}

export class OtpCodeEntity extends RootEntity<OtpCodeProps> {
  get userId() {
    return this.props.userId;
  }
  get phone() {
    return this.props.phone;
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
    props: Optional<OtpCodeProps, "createdAt" | "updatedAt" | "deletedAt">,
    id?: UUIDVO,
  ) {
    return new OtpCodeEntity(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? null,
        deletedAt: props.deletedAt ?? null,
      },
      id,
    );
  }
}
