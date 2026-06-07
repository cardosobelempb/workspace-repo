import { BaseRepository } from "@repo/common";
import { MagicLinkTokenEntity } from "../entities";

export abstract class MagicLinkRepository extends BaseRepository<MagicLinkTokenEntity> {}
