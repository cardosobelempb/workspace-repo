import { BaseAggregate, EmailVO, Optional, UUIDVO } from "@repo/common";

export interface AccountProps {
  userId: UUIDVO;
  providerAccountId: string;
  provider: string;
  email: EmailVO;
  refreshToken: string | null;
  accessToken: string | null;
  expiresAt: number | null;
  createdAt: Date;
  updatedAt: Date | null;
  deletedAt: Date | null;
}

export class AccountEntity extends BaseAggregate<AccountProps> {
  get userId() {
    return this.props.userId;
  }
  get providerAccountId() {
    return this.props.providerAccountId;
  }
  get provider() {
    return this.props.provider;
  }
  get email() {
    return this.props.email;
  }
  get refreshToken() {
    return this.props.refreshToken;
  }
  get accessToken() {
    return this.props.accessToken;
  }
  get expiresAt() {
    return this.props.expiresAt;
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

  softDelete(): void {
    if (!this.isDeleted()) {
      this.props.deletedAt = new Date();
      this.touch();
    }
  }
  restore(): void {
    this.props.deletedAt = null;
    this.touch();
  }

  isDeleted(): boolean {
    return this.props.deletedAt !== null;
  }

  updateEmail(email: EmailVO): void {
    this.props.email = email;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<AccountProps, "createdAt" | "updatedAt" | "deletedAt">,
    id?: UUIDVO,
  ) {
    return new AccountEntity(
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
