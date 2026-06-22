import { AggregateEntity } from "@/common/shared";
import { Optional } from "../types";
import { EmailVO, PasswordHashVO, UUIDVO } from "../values-objects";

export interface UserProps {
  email: EmailVO;
  firstName: string | null;
  lastName: string | null;
  passwordHash: PasswordHashVO;
  emailVerified: Date | null;
  createdAt: Date;
  updatedAt: Date | null;
  deletedAt: Date | null;
}

export class UserEntity extends AggregateEntity<UserProps> {
  get email() {
    return this.props.email;
  }
  get firstName() {
    return this.props.firstName;
  }
  get lastName() {
    return this.props.lastName;
  }
  get passwordHash() {
    return this.props.passwordHash;
  }
  get emailVerified() {
    return this.props.emailVerified;
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

  updateEmailVerified(verifiedAt: Date): void {
    this.props.emailVerified = new Date(verifiedAt);
    this.touch();
  }

  isDeleted(): boolean {
    return this.props.deletedAt !== null;
  }

  updateEmail(email: EmailVO): void {
    this.props.email = email;
    this.touch();
  }
  updatePasswordHash(hash: PasswordHashVO): void {
    this.props.passwordHash = hash;
    this.touch();
  }
  fullName(): string {
    const first = this.firstName ?? "";
    const last = this.lastName ?? "";
    return `${first} ${last}`.trim();
  }
  shotName(): string {
    const firstInitial = this.firstName ? this.firstName.charAt(0) : "";
    const lastInitial = this.lastName ? this.lastName.charAt(0) : "";
    return `${firstInitial}${lastInitial}`.toUpperCase();
  }
  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      UserProps,
      "firstName" | "lastName" | "emailVerified" | "createdAt" | "updatedAt" | "deletedAt"
    >,
    id?: UUIDVO,
  ) {
    return new UserEntity(
      {
        ...props,
        firstName: props.firstName ?? null,
        lastName: props.lastName ?? null,
        emailVerified: props.emailVerified ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? null,
        deletedAt: props.deletedAt ?? null,
      },
      id,
    );
  }
}
