# Guia — Upload em Monorepo com Core e Providers Separados

## 1. Objetivo

Separar o módulo de upload em packages independentes:

```txt
upload-core
  → contratos, tipos, validações, erros e adapters

upload-provider-local
  → implementação local com filesystem

upload-provider-s3
  → implementação AWS S3

upload-provider-r2
  → implementação Cloudflare R2

upload-provider-minio
  → implementação MinIO
```

A aplicação `apps/api` escolhe qual provider usar.

---

# 2. Estrutura final

```txt
packages/
├─ upload-core/
│  └─ src/
│     ├─ contracts/
│     │  └─ file-storage.contract.ts
│     ├─ constants/
│     │  └─ upload.constants.ts
│     ├─ errors/
│     │  └─ upload.errors.ts
│     ├─ validators/
│     │  └─ file-upload.validator.ts
│     ├─ adapters/
│     │  └─ multer-file.adapter.ts
│     └─ index.ts
│
├─ upload-provider-local/
│  └─ src/
│     ├─ local-file-storage.service.ts
│     └─ index.ts
│
├─ upload-provider-s3/
│  └─ src/
│     ├─ s3-file-storage.service.ts
│     └─ index.ts
│
└─ database/
   └─ prisma/
      └─ schema.prisma
```

---

# 3. Package `upload-core`

## `packages/upload-core/package.json`

```json
{
  "name": "@repo/upload-core",
  "version": "1.0.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "devDependencies": {
    "@types/express": "latest",
    "@types/multer": "latest",
    "typescript": "latest"
  }
}
```

---

## Contratos

```ts
// packages/upload-core/src/contracts/file-storage.contract.ts

export type FileVisibility = "public" | "private";

export type FileStorageProvider = "local" | "s3" | "r2" | "minio";

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
  storage: FileStorageProvider;
  checksum?: string | null;
}

export interface FileStorage {
  upload(file: UploadFileInput): Promise<StoredFile>;
  delete(filePath: string): Promise<void>;
}
```

---

## Constantes

```ts
// packages/upload-core/src/constants/upload.constants.ts

export const DEFAULT_MAX_FILE_SIZE_IN_BYTES = 5 * 1024 * 1024;

export const DEFAULT_MAX_FILES = 5;

export const DEFAULT_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;
```

---

## Validator

```ts
// packages/upload-core/src/validators/file-upload.validator.ts

import { UploadFileInput } from "../contracts/file-storage.contract";
import {
  FileTooLargeError,
  InvalidFileTypeError,
  NoFileProvidedError,
} from "../errors/upload.errors";

interface FileUploadValidatorOptions {
  maxFileSizeInBytes: number;
  allowedMimeTypes: string[];
}

export class FileUploadValidator {
  private readonly allowedMimeTypes: Set<string>;

  constructor(private readonly options: FileUploadValidatorOptions) {
    this.allowedMimeTypes = new Set(options.allowedMimeTypes);
  }

  validate(files: UploadFileInput[]): void {
    if (!files || files.length === 0) {
      throw new NoFileProvidedError();
    }

    for (const file of files) {
      if (!this.allowedMimeTypes.has(file.mimeType)) {
        throw new InvalidFileTypeError(file.mimeType);
      }

      if (file.size > this.options.maxFileSizeInBytes) {
        throw new FileTooLargeError(file.originalName);
      }
    }
  }
}
```

---

## Adapter Multer

```ts
// packages/upload-core/src/adapters/multer-file.adapter.ts

import { UploadFileInput } from "../contracts/file-storage.contract";

export class MulterFileAdapter {
  static toUploadFileInput(file: Express.Multer.File): UploadFileInput {
    return {
      originalName: file.originalname,
      buffer: file.buffer,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  static toUploadFileInputMany(files: Express.Multer.File[] = []): UploadFileInput[] {
    return files.map((file) => this.toUploadFileInput(file));
  }
}
```

---

## Erros

```ts
// packages/upload-core/src/errors/upload.errors.ts

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

## Exportações

```ts
// packages/upload-core/src/index.ts

export * from "./contracts/file-storage.contract";
export * from "./constants/upload.constants";
export * from "./errors/upload.errors";
export * from "./validators/file-upload.validator";
export * from "./adapters/multer-file.adapter";
```

---

# 4. Package `upload-provider-local`

## `packages/upload-provider-local/package.json`

```json
{
  "name": "@repo/upload-provider-local",
  "version": "1.0.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "dependencies": {
    "@repo/upload-core": "workspace:*"
  }
}
```

---

## Provider local

```ts
// packages/upload-provider-local/src/local-file-storage.service.ts

import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import { FileStorage, StoredFile, UploadFileInput } from "@repo/upload-core";

export interface LocalFileStorageOptions {
  uploadDir: string;
  publicBaseUrl?: string;
}

export class LocalFileStorageService implements FileStorage {
  constructor(private readonly options: LocalFileStorageOptions) {}

  async upload(file: UploadFileInput): Promise<StoredFile> {
    await this.ensureUploadDirectoryExists();
    const extension = path.extname(file.originalName).toLowerCase();
    const fileName = `${crypto.randomUUID()}${extension}`;
    const filePath = path.join(this.options.uploadDir, fileName);
    const checksum = crypto.createHash("sha256").update(file.buffer).digest("hex");
    await fs.writeFile(filePath, file.buffer);

    return {
      originalName: file.originalName,
      fileName,
      mimeType: file.mimeType,
      extension,
      size: file.size,
      path: filePath,
      url: this.options.publicBaseUrl
        ? `${this.options.publicBaseUrl}/${fileName}`
        : null,
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
    await fs.mkdir(this.options.uploadDir, { recursive: true });
  }
}
```

---

## Exportação

```ts
// packages/upload-provider-local/src/index.ts

export * from "./local-file-storage.service";
```

---

# 5. Package `upload-provider-s3`

## Instalação

```bash
pnpm add @aws-sdk/client-s3 -F @repo/upload-provider-s3
```

## `packages/upload-provider-s3/package.json`

```json
{
  "name": "@repo/upload-provider-s3",
  "version": "1.0.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "dependencies": {
    "@aws-sdk/client-s3": "latest",
    "@repo/upload-core": "workspace:*"
  }
}
```

---

## Provider S3

```ts
// packages/upload-provider-s3/src/s3-file-storage.service.ts

import crypto from "node:crypto";
import path from "node:path";

import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { FileStorage, StoredFile, UploadFileInput } from "@repo/upload-core";

interface S3FileStorageOptions {
  client: S3Client;
  bucket: string;
  baseUrl?: string;
  folder?: string;
}

export class S3FileStorageService implements FileStorage {
  constructor(private readonly options: S3FileStorageOptions) {}

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
      storage: "s3",
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
```

---

## Exportação

```ts
// packages/upload-provider-s3/src/index.ts

export * from "./s3-file-storage.service";
```

---

# 6. Package `upload-provider-r2`

Cloudflare R2 é compatível com API S3. Então você pode reutilizar a mesma lógica do S3, mudando endpoint e credenciais.

```txt
@repo/upload-provider-r2
  → pode usar S3Client com endpoint da Cloudflare
```

Exemplo na factory:

```ts
import { S3Client } from "@aws-sdk/client-s3";
import { S3FileStorageService } from "@repo/upload-provider-s3";

const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const fileStorage = new S3FileStorageService({
  client: r2Client,
  bucket: process.env.R2_BUCKET!,
  baseUrl: process.env.R2_PUBLIC_URL,
  folder: "uploads",
});
```

Para evitar duplicação, você pode criar:

```txt
upload-provider-s3-compatible
```

e usar para:

```txt
AWS S3
Cloudflare R2
MinIO
DigitalOcean Spaces
Wasabi
```

Essa é a opção mais profissional.

---

# 7. Melhor divisão profissional

Em vez de criar um package para cada provider compatível com S3, recomendo:

```txt
packages/
├─ upload-core/
├─ upload-provider-local/
└─ upload-provider-s3-compatible/
```

Porque R2, MinIO e Spaces usam protocolo compatível com S3.

---

# 8. Provider S3 compatible

```txt
packages/upload-provider-s3-compatible/
```

## `package.json`

```json
{
  "name": "@repo/upload-provider-s3-compatible",
  "version": "1.0.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "dependencies": {
    "@aws-sdk/client-s3": "latest",
    "@repo/upload-core": "workspace:*"
  }
}
```

## Serviço

```ts
// packages/upload-provider-s3-compatible/src/s3-compatible-file-storage.service.ts

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
```

---

# 9. Uso na `apps/api`

## Factory escolhendo provider por env

```ts
// apps/api/src/modules/upload/upload.factory.ts

import path from "node:path";

import { PrismaClient } from "@repo/database";

import {
  DEFAULT_ALLOWED_MIME_TYPES,
  DEFAULT_MAX_FILE_SIZE_IN_BYTES,
  FileStorage,
  FileUploadValidator,
} from "@repo/upload-core";

import { LocalFileStorageService } from "@repo/upload-provider-local";
import { S3CompatibleFileStorageService } from "@repo/upload-provider-s3-compatible";
import { S3Client } from "@aws-sdk/client-s3";

import { UploadController } from "./upload.controller";
import { UploadFilesUseCase } from "./upload-files.usecase";
import { PrismaUploadedFileRepository } from "./prisma-uploaded-file.repository";

const prisma = new PrismaClient();

function makeFileStorage(): FileStorage {
  const provider = process.env.UPLOAD_PROVIDER ?? "local";

  if (provider === "local") {
    return new LocalFileStorageService({
      uploadDir: path.resolve(process.cwd(), "uploads"),
      publicBaseUrl: "/uploads",
    });
  }

  if (provider === "s3") {
    const client = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    return new S3CompatibleFileStorageService({
      client,
      bucket: process.env.AWS_S3_BUCKET!,
      provider: "s3",
      baseUrl: process.env.AWS_S3_PUBLIC_URL,
      folder: "uploads",
    });
  }

  if (provider === "r2") {
    const client = new S3Client({
      region: "auto",
      endpoint: process.env.R2_ENDPOINT!,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });

    return new S3CompatibleFileStorageService({
      client,
      bucket: process.env.R2_BUCKET!,
      provider: "r2",
      baseUrl: process.env.R2_PUBLIC_URL,
      folder: "uploads",
    });
  }

  if (provider === "minio") {
    const client = new S3Client({
      region: process.env.MINIO_REGION ?? "us-east-1",
      endpoint: process.env.MINIO_ENDPOINT!,
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY_ID!,
        secretAccessKey: process.env.MINIO_SECRET_ACCESS_KEY!,
      },
    });

    return new S3CompatibleFileStorageService({
      client,
      bucket: process.env.MINIO_BUCKET!,
      provider: "minio",
      baseUrl: process.env.MINIO_PUBLIC_URL,
      folder: "uploads",
    });
  }

  throw new Error(`UPLOAD_PROVIDER inválido: ${provider}`);
}

const fileStorage = makeFileStorage();

const uploadedFileRepository = new PrismaUploadedFileRepository(prisma);

const fileUploadValidator = new FileUploadValidator({
  maxFileSizeInBytes: DEFAULT_MAX_FILE_SIZE_IN_BYTES,
  allowedMimeTypes: [...DEFAULT_ALLOWED_MIME_TYPES],
});

const uploadFilesUseCase = new UploadFilesUseCase(
  fileStorage,
  uploadedFileRepository,
  fileUploadValidator,
);

export const uploadController = new UploadController(uploadFilesUseCase);
```

---

# 10. Variáveis de ambiente

## Local

```env
UPLOAD_PROVIDER=local
```

## AWS S3

```env
UPLOAD_PROVIDER=s3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your_bucket
AWS_S3_PUBLIC_URL=https://your-bucket.s3.amazonaws.com
```

## Cloudflare R2

```env
UPLOAD_PROVIDER=r2
R2_ENDPOINT=https://account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET=your_bucket
R2_PUBLIC_URL=https://cdn.seudominio.com
```

## MinIO

```env
UPLOAD_PROVIDER=minio
MINIO_ENDPOINT=http://localhost:9000
MINIO_REGION=us-east-1
MINIO_ACCESS_KEY_ID=minioadmin
MINIO_SECRET_ACCESS_KEY=minioadmin
MINIO_BUCKET=uploads
MINIO_PUBLIC_URL=http://localhost:9000/uploads
```

---

# 11. Regra de dependência

## Correto

```txt
upload-provider-local
        depende de
upload-core
```

```txt
upload-provider-s3-compatible
        depende de
upload-core
```

```txt
apps/api
        depende de
upload-core
upload-provider-local
upload-provider-s3-compatible
database
```

## Evite

```txt
upload-core depender de provider
```

O core nunca deve conhecer S3, Local, R2 ou MinIO.

---

# 12. Resumo profissional

Use esta separação:

```txt
@repo/upload-core
  → contratos, erros, validações, adapters

@repo/upload-provider-local
  → filesystem local

@repo/upload-provider-s3-compatible
  → AWS S3, Cloudflare R2, MinIO, Spaces, Wasabi

apps/api
  → controller, routes, use case, tenant, ownerId, permissions

@repo/database
  → Prisma schema, migrations e client
```

Essa abordagem é mais escalável, desacoplada e adequada para monorepo profissional.
