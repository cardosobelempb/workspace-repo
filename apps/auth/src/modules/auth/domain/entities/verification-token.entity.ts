import { BaseEntity, Optional, UUIDVO } from "@repo/common";

export interface VerificationTokenProps {
  identifier: UUIDVO;
  token: string;
  expiredAt: Date;
  usedAt: Date | null;
}

export class VerificationTokenEntity extends BaseEntity<VerificationTokenProps> {
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

  static create(props: Optional<VerificationTokenProps, "usedAt">, id?: UUIDVO) {
    return new VerificationTokenEntity(
      {
        ...props,

        usedAt: props.usedAt ?? null,
      },
      id,
    );
  }
}
