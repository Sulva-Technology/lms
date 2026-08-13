export interface FileUploadPayload {
  bucket: string;
  path: string;
  contentType?: string;
  size?: number;
}

export interface FileMetadata {
  id: string;
  universityId: string;
  uploaderId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  storagePath: string;
  isPublic: boolean;
  createdAt: string;
}
