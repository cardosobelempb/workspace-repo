import { BaseEntity, Optional, UUIDVO } from "@repo/common";
import { FileStorageProvider } from "../../shared/types/file-torage.provider";
import { FileVisibility } from "../../shared/types/file-visibility";

export interface UploadedFileEntityProps {
  tenantId: UUIDVO | null;
  ownerId: UUIDVO | null;
  originalName: string;
  fileName: string;
  mimeType: string;
  extension: string;
  size: number;
  path: string;
  url: string | null;
  storage: FileStorageProvider;
  visibility: FileVisibility;
  checksum: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export class UploadedFileEntity extends BaseEntity<UploadedFileEntityProps> {
  get tenantId() {
    return this.props.tenantId;
  }

  get ownerId() {
    return this.props.ownerId;
  }

  get originalName() {
    return this.props.originalName;
  }

  get fileName() {
    return this.props.fileName;
  }

  get mimeType() {
    return this.props.mimeType;
  }

  get extension() {
    return this.props.extension;
  }

  get size() {
    return this.props.size;
  }

  get path() {
    return this.props.path;
  }

  get url() {
    return this.props.url;
  }

  get storage() {
    return this.props.storage;
  }

  get visibility() {
    return this.props.visibility;
  }

  get checksum() {
    return this.props.checksum;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      UploadedFileEntityProps,
      "tenantId" | "ownerId" | "url" | "updatedAt" | "updatedAt"
    >,
    id?: UUIDVO,
  ) {
    return new UploadedFileEntity(
      {
        ...props,
        tenantId: props.tenantId || null,
        ownerId: props.ownerId || null,
        url: props.url || null,
        updatedAt: props.updatedAt || null,
      },
      id,
    );
  }
}
