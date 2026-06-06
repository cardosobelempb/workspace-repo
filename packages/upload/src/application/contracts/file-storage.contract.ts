import { StoredFile } from "../../shared/types/stored-file";
import { UploadFileInput } from "../../shared/types/upload-file-input";

export abstract class FileStorage {
  abstract upload(file: UploadFileInput): Promise<StoredFile>;
  abstract delete(filePath: string): Promise<void>;
}
