# Guia de Implementação — Upload de Arquivos com Multer, Clean Architecture e Prisma

## Objetivo

Implementar um módulo profissional de upload de arquivos em TypeScript, permitindo upload de um ou múltiplos arquivos, com:

- Multer apenas na camada HTTP;
- Use Case desacoplado do Express;
- interface própria para arquivos;
- persistência física do arquivo;
- persistência dos metadados no banco com Prisma;
- rollback em caso de falha;
- preparação para LocalStorage, S3, R2 ou MinIO.

---

## Arquitetura recomendada

```txt
Request multipart/form-data
        ↓
Multer Middleware
        ↓
MulterFileAdapter
        ↓
UploadFileInput[]
        ↓
UploadFilesUseCase
        ↓
FileStorage
        ↓
UploadedFileRepository
        ↓
Prisma / Banco de Dados
```

---

## Estrutura de pastas

```txt
src/modules/upload/
├─ domain/
│  ├─ entities/
│  │  └─ uploaded-file.entity.ts
│  └─ repositories/
│     └─ uploaded-file.repository.ts
├─ application/
│  ├─ contracts/
│  │  └─ file-storage.contract.ts
│  ├─ errors/
│  │  └─ upload.errors.ts
│  └─ usecases/
│     └─ upload-files.usecase.ts
├─ infra/
│  ├─ repositories/
│  │  └─ prisma-uploaded-file.repository.ts
│  └─ storage/
│     └─ local-file-storage.service.ts
├─ presentation/
│  ├─ adapters/
│  │  └─ multer-file.adapter.ts
│  └─ controllers/
│     └─ upload.controller.ts
├─ upload.factory.ts
└─ upload.routes.ts
```

---

## Passo 1 — Criar model no Prisma

```prisma
model UploadedFile {
  id           String   @id @default(uuid())
  tenantId     String?
  ownerId      String?

  originalName String
  fileName     String
  mimeType     String
  extension    String
  size         Int

  path         String
  url          String?
  storage      String
  visibility   String   @default("private")

  checksum     String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([tenantId])
  @@index([ownerId])
  @@index([mimeType])
  @@map("uploaded_files")
}
```

Execute a migration:

```bash
npx prisma migrate dev --name create_uploaded_files
```

---

## Passo 2 — Criar entidade de domínio

```ts
// src/modules/upload/domain/entities/uploaded-file.entity.ts

export type FileVisibility = "public" | "private";

export type FileStorageProvider = "local" | "s3" | "r2" | "minio";

export interface UploadedFile {
  id: string;
  tenantId?: string | null;
  ownerId?: string | null;

  originalName: string;
  fileName: string;
  mimeType: string;
  extension: string;
  size: number;

  path: string;
  url?: string | null;
  storage: FileStorageProvider;
  visibility: FileVisibility;

  checksum?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Passo 3 — Criar contrato do storage

```ts
// src/modules/upload/application/contracts/file-storage.contract.ts

import { FileVisibility } from "../../domain/entities/uploaded-file.entity";

export interface UploadFileInput {
  originalName: string;
  buffer: Buffer;
  mimeType: string;
  size: number;
  visibility?: FileVisibility;
}

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

export interface FileStorage {
  upload(file: UploadFileInput): Promise<StoredFile>;
  delete(filePath: string): Promise<void>;
}
```

---

## Passo 4 — Criar repository de domínio

```ts
// src/modules/upload/domain/repositories/uploaded-file.repository.ts

import { UploadedFile } from "../entities/uploaded-file.entity";

export interface CreateUploadedFileDTO {
  tenantId?: string | null;
  ownerId?: string | null;

  originalName: string;
  fileName: string;
  mimeType: string;
  extension: string;
  size: number;

  path: string;
  url?: string | null;
  storage: string;
  visibility: string;
  checksum?: string | null;
}

export interface UploadedFileRepository {
  create(data: CreateUploadedFileDTO): Promise<UploadedFile>;
  findById(id: string): Promise<UploadedFile | null>;
  deleteById(id: string): Promise<void>;
}
```

---

## Passo 5 — Criar erros customizados

```ts
// src/modules/upload/application/errors/upload.errors.ts

export class NoFileProvidedError extends Error {
  constructor() {
    super("Nenhum arquivo foi enviado.");
    this.name = "NoFileProvidedError";
  }
}

export class InvalidFileTypeError extends Error {
  constructor(mimeType: string) {
    super(`Tipo de arquivo não permitido: ${mimeType}`);
    this.name = "InvalidFileTypeError";
  }
}

export class FileTooLargeError extends Error {
  constructor(fileName: string) {
    super(`Arquivo muito grande: ${fileName}`);
    this.name = "FileTooLargeError";
  }
}
```

---

## Passo 6 — Implementar storage local

```ts
// src/modules/upload/infra/storage/local-file-storage.service.ts

import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs/promises";

import {
  FileStorage,
  StoredFile,
  UploadFileInput,
} from "../../application/contracts/file-storage.contract";

export class LocalFileStorageService implements FileStorage {
  private readonly uploadDir = path.resolve(process.cwd(), "uploads");

  async upload(file: UploadFileInput): Promise<StoredFile> {
    await this.ensureUploadDirectoryExists();

    const extension = path.extname(file.originalName).toLowerCase();
    const fileName = `${crypto.randomUUID()}${extension}`;
    const filePath = path.join(this.uploadDir, fileName);

    const checksum = crypto.createHash("sha256").update(file.buffer).digest("hex");

    await fs.writeFile(filePath, file.buffer);

    return {
      originalName: file.originalName,
      fileName,
      mimeType: file.mimeType,
      extension,
      size: file.size,
      path: filePath,
      url: `/uploads/${fileName}`,
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
    await fs.mkdir(this.uploadDir, {
      recursive: true,
    });
  }
}
```

---

## Passo 7 — Implementar repository Prisma

```ts
// src/modules/upload/infra/repositories/prisma-uploaded-file.repository.ts

import { PrismaClient } from "@prisma/client";

import {
  CreateUploadedFileDTO,
  UploadedFileRepository,
} from "../../domain/repositories/uploaded-file.repository";

import { UploadedFile } from "../../domain/entities/uploaded-file.entity";

export class PrismaUploadedFileRepository implements UploadedFileRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateUploadedFileDTO): Promise<UploadedFile> {
    return this.prisma.uploadedFile.create({
      data,
    }) as Promise<UploadedFile>;
  }

  async findById(id: string): Promise<UploadedFile | null> {
    return this.prisma.uploadedFile.findUnique({
      where: { id },
    }) as Promise<UploadedFile | null>;
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.uploadedFile.delete({
      where: { id },
    });
  }
}
```

---

## Passo 8 — Criar Use Case

```ts
// src/modules/upload/application/usecases/upload-files.usecase.ts

import { FileStorage, UploadFileInput } from "../contracts/file-storage.contract";

import { UploadedFileRepository } from "../../domain/repositories/uploaded-file.repository";
import { UploadedFile } from "../../domain/entities/uploaded-file.entity";

import {
  FileTooLargeError,
  InvalidFileTypeError,
  NoFileProvidedError,
} from "../errors/upload.errors";

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
```

---

## Passo 9 — Criar adapter do Multer

```ts
// src/modules/upload/presentation/adapters/multer-file.adapter.ts

import { UploadFileInput } from "../../application/contracts/file-storage.contract";

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
```

---

## Passo 10 — Configurar Multer

```ts
// src/shared/infra/http/middlewares/multer-upload.middleware.ts

import multer from "multer";

const MAX_FILE_SIZE_IN_BYTES = 5 * 1024 * 1024;
const MAX_FILES = 5;

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

export const multerUpload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: MAX_FILE_SIZE_IN_BYTES,
    files: MAX_FILES,
  },

  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return callback(new Error(`Tipo de arquivo não permitido: ${file.mimetype}`));
    }

    return callback(null, true);
  },
});
```

---

## Passo 11 — Criar controller

```ts
// src/modules/upload/presentation/controllers/upload.controller.ts

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
```

---

## Passo 12 — Criar factory

```ts
// src/modules/upload/upload.factory.ts

import { PrismaClient } from "@prisma/client";

import { UploadController } from "./presentation/controllers/upload.controller";
import { UploadFilesUseCase } from "./application/usecases/upload-files.usecase";
import { LocalFileStorageService } from "./infra/storage/local-file-storage.service";
import { PrismaUploadedFileRepository } from "./infra/repositories/prisma-uploaded-file.repository";

const prisma = new PrismaClient();

const fileStorage = new LocalFileStorageService();

const uploadedFileRepository = new PrismaUploadedFileRepository(prisma);

const uploadFilesUseCase = new UploadFilesUseCase(fileStorage, uploadedFileRepository);

export const uploadController = new UploadController(uploadFilesUseCase);
```

---

## Passo 13 — Criar rotas

```ts
// src/modules/upload/upload.routes.ts

import { Router } from "express";

import { multerUpload } from "../../shared/infra/http/middlewares/multer-upload.middleware";
import { uploadController } from "./upload.factory";

const uploadRoutes = Router();

uploadRoutes.post(
  "/",
  multerUpload.array("files", 5),
  uploadController.upload.bind(uploadController),
);

export { uploadRoutes };
```

---

## Passo 14 — Registrar no app

```ts
// src/app.ts

import express from "express";
import path from "node:path";

import { uploadRoutes } from "./modules/upload/upload.routes";

const app = express();

app.use(express.json());

app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

app.use("/api/uploads", uploadRoutes);

export { app };
```

---

## Testando com cURL

### Upload de um arquivo

```bash
curl -X POST http://localhost:3000/api/uploads \
  -F "files=@avatar.png"
```

### Upload de múltiplos arquivos

```bash
curl -X POST http://localhost:3000/api/uploads \
  -F "files=@avatar.png" \
  -F "files=@documento.pdf"
```

---

## Boas práticas aplicadas

### 1. Multer isolado na camada HTTP

O use case não recebe `Express.Multer.File`.

Correto:

```ts
execute(input: UploadFilesUseCaseInput)
```

Evite:

```ts
execute(files: Express.Multer.File[])
```

Isso evita acoplamento com Express e Multer.

---

### 2. Use Case depende de interfaces

O use case depende de:

```ts
FileStorage;
UploadedFileRepository;
```

E não diretamente de:

```ts
PrismaClient;
fs;
S3;
Multer;
Express;
```

Isso facilita testes e troca de infraestrutura.

---

### 3. Rollback manual

Se o arquivo for salvo fisicamente, mas o banco falhar, o arquivo é removido.

Isso evita arquivos órfãos no storage.

---

### 4. Checksum SHA-256

O checksum ajuda em:

- validação de integridade;
- detecção de duplicidade;
- auditoria;
- rastreabilidade.

---

### 5. Multi-tenant ready

Os campos `tenantId` e `ownerId` permitem associar arquivos a usuários, organizações ou tenants.

---

## Erros comuns

### Erro 1 — Salvar arquivo com nome original

Evite:

```ts
const fileName = file.originalName;
```

Problemas:

- sobrescrita;
- path traversal;
- conflitos de nomes;
- exposição de dados sensíveis.

Use:

```ts
const fileName = `${crypto.randomUUID()}${extension}`;
```

---

### Erro 2 — Acoplar Use Case ao Multer

Evite:

```ts
async execute(files: Express.Multer.File[]) {}
```

Use:

```ts
async execute(input: UploadFilesUseCaseInput) {}
```

---

### Erro 3 — Não persistir metadados

Sem metadados no banco, você perde:

- auditoria;
- vínculo com usuário;
- vínculo com tenant;
- histórico;
- controle de permissão.

---

### Erro 4 — Não validar tamanho e tipo

Sempre valide:

- tamanho máximo;
- MIME type;
- quantidade de arquivos;
- extensão;
- permissões do usuário.

---

## Complexidade

Para `n` arquivos:

```txt
Tempo: O(n)
Memória: O(n)
```

Cada arquivo é validado, salvo e persistido uma única vez.

---

## Próximos passos recomendados

### 1. Criar endpoint para buscar arquivo

```txt
GET /api/uploads/:id
```

Com validação de `ownerId` e `tenantId`.

---

### 2. Criar endpoint para remover arquivo

```txt
DELETE /api/uploads/:id
```

Fluxo recomendado:

```txt
Buscar arquivo no banco
Validar permissão
Remover do storage
Remover do banco
```

---

### 3. Criar storage S3/R2/MinIO

Como o use case depende de `FileStorage`, basta criar outra implementação:

```ts
export class S3FileStorageService implements FileStorage {}
```

Sem alterar o use case.

---

### 4. Adicionar testes unitários

Testar principalmente:

- upload sem arquivos;
- tipo inválido;
- arquivo grande;
- sucesso com um arquivo;
- sucesso com múltiplos arquivos;
- rollback quando repository falhar.

---

## Resumo da decisão profissional

A melhor abordagem é:

```txt
Multer = infraestrutura HTTP
Adapter = tradução
Use Case = regra de negócio
Storage = persistência física
Repository = persistência dos metadados
Prisma = infraestrutura de banco
```

Essa arquitetura é limpa, testável, escalável e pronta para produção.
