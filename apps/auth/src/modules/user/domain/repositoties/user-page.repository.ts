import { PageRepository } from "@repo/common";
import { UserEntity } from "../entities/user.entity";

export abstract class UserPageRepository extends PageRepository<UserEntity> {}
