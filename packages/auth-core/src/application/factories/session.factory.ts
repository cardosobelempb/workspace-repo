import { UUIDVO } from "@repo/common";
import { SessionEntity } from "../../domain/entities/session.entity";

export type BuildSessionInput = {
  userId: string;
  sessionToken: string;
  expires: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export class SessionFactory {
  static build(input: BuildSessionInput): SessionEntity {
    return SessionEntity.create({
      userId: UUIDVO.create(input.userId),
      sessionToken: input.sessionToken,
      expires: input.expires,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    });
  }
}
