import "express";
import "multer";

import { UploadFileInput } from "../../storage/file-storage.contract";

export class MulterFileAdapter {
  static toUploadFileInput(file: Express.Multer.File): UploadFileInput {
    return {
      originalName: file.originalname,
      buffer: file.buffer,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  static toUploadFileInputMany(files: Express.Multer.File[]): UploadFileInput[] {
    return files.map((file) => this.toUploadFileInput(file));
  }
}
