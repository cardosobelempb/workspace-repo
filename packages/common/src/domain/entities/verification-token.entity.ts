import { RootEntity } from "@/common/shared";
import { Optional } from "../types";
import { UUIDVO } from "../values-objects";

export interface VerificationTokenProps {
  identifier: UUIDVO;
  token: string;
  expiredAt: Date;
  createdAt: Date;
  usedAt: Date | null;
}

export class VerificationTokenEntity extends RootEntity<VerificationTokenProps> {
  get identifier() {
    return this.props.identifier;
  }

  get token() {
    return this.props.token;
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

  static create(
    props: Optional<VerificationTokenProps, "usedAt" | "createdAt">,
    id?: UUIDVO,
  ) {
    return new VerificationTokenEntity(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
        usedAt: props.usedAt ?? null,
      },
      id,
    );
  }
}
