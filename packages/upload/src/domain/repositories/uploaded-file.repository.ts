import { BaseRepository } from "@repo/common";
import { UploadedFileEntity } from "../entities/uploaded-file.entity";

export interface CreateUploadedFileDTO {
  tenantId?: string | null;
  ownerId?: string | null;
  originalName: string;
  fileName: string;
  mimeType: string;
  extension: string;
  size: number;
  path: string;
  url?: string | null;
  storage: string;
  visibility: string;
  checksum?: string | null;
}
export abstract class UploadedFileRepository extends BaseRepository<UploadedFileEntity> {}
