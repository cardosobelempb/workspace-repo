export interface StoredFile {
  originalName: string;
  fileName: string;
  mimeType: string;
  extension: string;
  size: number;
  path: string;
  url?: string | null;
  storage: "local" | "s3" | "r2" | "minio";
  checksum?: string | null;
}
