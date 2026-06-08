import { UUIDVO } from "@repo/common";
import { SessionEntity } from "../../domain/entities/session.entity";
import { SessionCreateDto } from "../dto";

export class SessionFactory {
  static build(input: SessionCreateDto): SessionEntity {
    return SessionEntity.create({
      userId: UUIDVO.create(input.userId),
      sessionToken: input.sessionToken,
      expires: new Date(input.expires),
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    });
  }
}
