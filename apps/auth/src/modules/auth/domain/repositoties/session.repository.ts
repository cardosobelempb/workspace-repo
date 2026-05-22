import { BaseRepository } from "@repo/common";
import { SessionEntity } from "../entities/session.entity";

export abstract class SessionRepository extends BaseRepository<SessionEntity> {}
