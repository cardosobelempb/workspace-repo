import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import { FileStorage, StoredFile, UploadFileInput } from "@repo/upload-core";

export interface LocalFileStorageOptions {
  uploadDir: string;
  publicBaseUrl?: string;
}

export class LocalFileStorageService implements FileStorage {
  constructor(private readonly options: LocalFileStorageOptions) {}

  async upload(file: UploadFileInput): Promise<StoredFile> {
    await this.ensureUploadDirectoryExists();
    const extension = path.extname(file.originalName).toLowerCase();
    const fileName = `${crypto.randomUUID()}${extension}`;
    const filePath = path.join(this.options.uploadDir, fileName);
    const checksum = crypto.createHash("sha256").update(file.buffer).digest("hex");
    await fs.writeFile(filePath, file.buffer);

    return {
      originalName: file.originalName,
      fileName,
      mimeType: file.mimeType,
      extension,
      size: file.size,
      path: filePath,
      url: this.options.publicBaseUrl
        ? `${this.options.publicBaseUrl}/${fileName}`
        : null,
      storage: "local",
      checksum,
    };
  }

  async delete(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch {
      // Evita quebrar rollback caso o arquivo já tenha sido removido.
    }
  }
  private async ensureUploadDirectoryExists(): Promise<void> {
    await fs.mkdir(this.options.uploadDir, { recursive: true });
  }
}
