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
  async findById(id: string): Promise<UploadedFileEntity | null> {
    const record = await this.prisma.uploadedFile.findUnique({
      where: { id },
    });

    if (!record) {
      return null;
    }

    return this.toEntity(record);
  }
  async findManyByIds(ids: string[]): Promise<UploadedFileEntity[]> {
    throw new Error("Method not implemented.");
  }
  async create(entity: UploadedFileEntity): Promise<UploadedFileEntity> {
    throw new Error("Method not implemented.");
  }
  async exists(id: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  async save(entity: UploadedFileEntity): Promise<UploadedFileEntity> {
    throw new Error("Method not implemented.");
  }
  async delete(entity: UploadedFileEntity): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
