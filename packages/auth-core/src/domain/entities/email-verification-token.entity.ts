import { BaseAggregate, Optional, UUIDVO } from "@repo/common";

export interface EmailVerificationTokenProps {
  userId: UUIDVO;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
  deletedAt: Date | null;
}

export class EmailVerificationTokenEntity extends BaseAggregate<EmailVerificationTokenProps> {
  get userId() {
    return this.props.userId;
  }
  get tokenHash() {
    return this.props.tokenHash;
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
    props: Optional<EmailVerificationTokenProps, "createdAt" | "deletedAt">,
    id?: UUIDVO,
  ) {
    return new EmailVerificationTokenEntity(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
        deletedAt: props.deletedAt ?? null,
      },
      id,
    );
  }
}
