import { EmailVO, UUIDVO } from "@repo/common";
import { UserEntity } from "../../entities";
import { UserRepository } from "../../repositories";

export class UserInMemoryRepository implements UserRepository {
  public items: UserEntity[] = [];

  async findActiveByEmail(email: string): Promise<UserEntity | null> {
    const user = this.items.find(
      (item) => item.email.equals(EmailVO.create(email)) && item.deletedAt === null,
    );

    return user || null;
  }
  async findActiveById(id: string): Promise<UserEntity | null> {
    const user = this.items.find(
      (item) => item.id.equals(UUIDVO.create(id)) && item.deletedAt === null,
    );

    return user || null;
  }
  async existsByEmail(email: string): Promise<boolean> {
    const user = this.items.find(
      (item) => item.email.equals(EmailVO.create(email)) && item.deletedAt === null,
    );

    return !!user;
  }
  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = this.items.find((item) => item.email.equals(EmailVO.create(email)));

    return user || null;
  }
  async markEmailVerified(userId: string, verifiedAt: Date): Promise<void> {
    const user = this.items.find((item) => item.id.equals(UUIDVO.create(userId)));

    if (!user) {
      return;
    }

    user.updateEmailVerified(verifiedAt);
  }
  async softDelete(userId: string): Promise<void> {
    const user = this.items.find((item) => item.id.equals(UUIDVO.create(userId)));

    if (!user) {
      return;
    }

    user.softDelete();
  }
  async findById(id: string): Promise<UserEntity | null> {
    const user = this.items.find((item) => item.id.equals(UUIDVO.create(id)));

    return user || null;
  }
  async findManyByIds(ids: string[]): Promise<UserEntity[]> {
    const users = this.items.filter((item) =>
      ids.some((id) => item.id.equals(UUIDVO.create(id))),
    );

    return users;
  }
  async create(entity: UserEntity): Promise<UserEntity> {
    this.items.push(entity);

    return entity;
  }
  async exists(id: string): Promise<boolean> {
    const user = this.items.find((item) => item.id.equals(UUIDVO.create(id)));

    return !!user;
  }
  async save(entity: UserEntity): Promise<UserEntity> {
    const index = this.items.findIndex((item) => item.id.equals(entity.id));

    if (index === -1) {
      this.items.push(entity);
    } else {
      this.items[index] = entity;
    }

    return entity;
  }
  async delete(entity: UserEntity): Promise<void> {
    const itemIndex = this.items.findIndex((item) => item.id === entity.id);

    this.items.splice(itemIndex, 1);
  }
}
