interface UploadFilesUseCaseInput {
  files: UploadFileInput[];
  tenantId?: string;
  ownerId?: string;
  visibility?: "public" | "private";
}

export class UploadFilesUseCase {
  private readonly maxFileSizeInBytes = 5 * 1024 * 1024;

  private readonly allowedMimeTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ]);

  constructor(
    private readonly fileStorage: FileStorage,
    private readonly uploadedFileRepository: UploadedFileRepository,
  ) {}

  async execute(input: UploadFilesUseCaseInput): Promise<UploadedFile[]> {
    const files = input.files;

    if (!files || files.length === 0) {
      throw new NoFileProvidedError();
    }

    this.validateFiles(files);

    const uploadedFiles: UploadedFile[] = [];
    const storedPaths: string[] = [];

    try {
      for (const file of files) {
        const storedFile = await this.fileStorage.upload({
          ...file,
          visibility: input.visibility ?? "private",
        });

        storedPaths.push(storedFile.path);

        const uploadedFile = await this.uploadedFileRepository.create({
          tenantId: input.tenantId ?? null,
          ownerId: input.ownerId ?? null,

          originalName: storedFile.originalName,
          fileName: storedFile.fileName,
          mimeType: storedFile.mimeType,
          extension: storedFile.extension,
          size: storedFile.size,

          path: storedFile.path,
          url: storedFile.url,
          storage: storedFile.storage,
          visibility: input.visibility ?? "private",
          checksum: storedFile.checksum,
        });

        uploadedFiles.push(uploadedFile);
      }

      return uploadedFiles;
    } catch (error) {
      await Promise.all(storedPaths.map((filePath) => this.fileStorage.delete(filePath)));

      throw error;
    }
  }

  private validateFiles(files: UploadFileInput[]): void {
    for (const file of files) {
      if (!this.allowedMimeTypes.has(file.mimeType)) {
        throw new InvalidFileTypeError(file.mimeType);
      }

      if (file.size > this.maxFileSizeInBytes) {
        throw new FileTooLargeError(file.originalName);
      }
    }
  }
}
