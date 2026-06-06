import { FileVisibility } from "./file-visibility";

export interface UploadFileInput {
  originalName: string;
  buffer: Buffer;
  mimeType: string;
  size: number;
  visibility?: FileVisibility;
}
