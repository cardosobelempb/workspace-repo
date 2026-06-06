import crypto from "node:crypto";
import path from "node:path";

import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import {
  FileStorage,
  FileStorageProvider,
  StoredFile,
  UploadFileInput,
} from "@repo/upload-core";

interface S3CompatibleFileStorageOptions {
  client: S3Client;
  bucket: string;
  provider: Extract<FileStorageProvider, "s3" | "r2" | "minio">;
  baseUrl?: string;
  folder?: string;
}

export class S3CompatibleFileStorageService implements FileStorage {
  constructor(private readonly options: S3CompatibleFileStorageOptions) {}

  async upload(file: UploadFileInput): Promise<StoredFile> {
    const extension = path.extname(file.originalName).toLowerCase();
    const fileName = `${crypto.randomUUID()}${extension}`;

    const key = this.options.folder ? `${this.options.folder}/${fileName}` : fileName;

    const checksum = crypto.createHash("sha256").update(file.buffer).digest("hex");

    await this.options.client.send(
      new PutObjectCommand({
        Bucket: this.options.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimeType,
        Metadata: {
          originalName: file.originalName,
          checksum,
        },
      }),
    );

    return {
      originalName: file.originalName,
      fileName,
      mimeType: file.mimeType,
      extension,
      size: file.size,
      path: key,
      url: this.options.baseUrl ? `${this.options.baseUrl}/${key}` : null,
      storage: this.options.provider,
      checksum,
    };
  }

  async delete(filePath: string): Promise<void> {
    await this.options.client.send(
      new DeleteObjectCommand({
        Bucket: this.options.bucket,
        Key: filePath,
      }),
    );
  }
}
