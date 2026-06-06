import { FileTooLargeError } from "../errors/file-too-large.error";
import { InvalidFileTypeError } from "../errors/invalid-file-type.error";
import { NoFileProvidedError } from "../errors/no-file-provided.error";
import { FileUploadValidatorOptions } from "../shared/types/file-upload-nalidator.options";
import { UploadFileInput } from "../shared/types/upload-file-input";

export class FileUploadValidator {
  private readonly allowedMimeTypes: Set<string>;
  constructor(private readonly options: FileUploadValidatorOptions) {
    this.allowedMimeTypes = new Set(options.allowedMimeTypes);
  }
  validate(files: UploadFileInput[]): void {
    if (!files || files.length === 0) {
      throw new NoFileProvidedError({
        fieldName: "File",
        message: "No file provided for upload.",
      });
    }
    for (const file of files) {
      if (!this.allowedMimeTypes.has(file.mimeType)) {
        throw new InvalidFileTypeError({
          fieldName: "File",
          value: file.originalName,
          message: `File "${file.originalName}" has an invalid type "${file.mimeType}". Allowed types are: ${[...this.allowedMimeTypes].join(", ")}.`,
        });
      }
      if (file.size > this.options.maxFileSizeInBytes) {
        throw new FileTooLargeError({
          fieldName: "File",
          value: file.originalName,
          message: `File "${file.originalName}" exceeds the maximum allowed size of ${this.options.maxFileSizeInBytes} bytes.`,
        });
      }
    }
  }
}
