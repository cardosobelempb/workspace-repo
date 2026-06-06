import { PRISMA_TOKENS, PrismaDatabase, PrismaRepository } from "@repo/database";
import { UploadedFileEntity } from "../../domain/entities/uploaded-file.entity";
import { UploadedFileRepository } from "../../domain/repositories/uploaded-file.repository";

export class PrismaUploadedFileRepository
  extends PrismaRepository<UploadedFileEntity>
  implements UploadedFileRepository
{
  static inject = [PRISMA_TOKENS.PRISMA_CLIENT];
  constructor(prisma: PrismaDatabase) {
    super(prisma);
  }
  findById(id: string): Promise<UploadedFileEntity | null> {
    throw new Error("Method not implemented.");
  }
  findManyByIds(ids: string[]): Promise<UploadedFileEntity[]> {
    throw new Error("Method not implemented.");
  }
  create(entity: UploadedFileEntity): Promise<UploadedFileEntity> {
    throw new Error("Method not implemented.");
  }
  exists(id: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  save(entity: UploadedFileEntity): Promise<UploadedFileEntity> {
    throw new Error("Method not implemented.");
  }
  delete(entity: UploadedFileEntity): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
