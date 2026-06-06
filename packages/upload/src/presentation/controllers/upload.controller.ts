import { Request, Response } from "express";

import { UploadFilesUseCase } from "../../application/usecases/upload-files.usecase";
import { MulterFileAdapter } from "../adapters/multer-file.adapter";

export class UploadController {
  constructor(private readonly uploadFilesUseCase: UploadFilesUseCase) {}

  async upload(req: Request, res: Response): Promise<Response> {
    const multerFiles = req.files as Express.Multer.File[] | undefined;

    const files = MulterFileAdapter.toUploadFileInputMany(multerFiles ?? []);

    const user = req.user as
      | {
          id: string;
          tenantId?: string;
        }
      | undefined;

    const uploadedFiles = await this.uploadFilesUseCase.execute({
      files,
      ownerId: user?.id,
      tenantId: user?.tenantId,
      visibility: "private",
    });

    return res.status(201).json({
      message: "Arquivos enviados com sucesso.",
      files: uploadedFiles,
    });
  }
}
