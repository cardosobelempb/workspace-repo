import { UploadFileInput } from "../shared/types/upload-file-input";

import { StoredFile } from "../shared/types/stored-file";

export abstract class FileStorage {
  abstract upload(file: UploadFileInput): Promise<StoredFile>;
  abstract delete(filePath: string): Promise<void>;
}
