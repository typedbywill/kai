export type AttachmentType =
  | "image"
  | "pdf"
  | "text"
  | "markdown"
  | "json"
  | "csv"
  | "unknown";

export type AttachmentStatus = "pending" | "reading" | "ready" | "error";

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: AttachmentType;
  mimeType: string;
  status: AttachmentStatus;
  /** Base64 data for images, text content for text files */
  content?: string;
  /** Preview thumbnail (data URL) for images */
  preview?: string;
  /** Error message if status is "error" */
  error?: string;
}

const MIME_MAP: Record<string, AttachmentType> = {
  "image/png": "image",
  "image/jpeg": "image",
  "image/webp": "image",
  "image/gif": "image",
  "application/pdf": "pdf",
  "text/plain": "text",
  "text/markdown": "markdown",
  "application/json": "json",
  "text/csv": "csv",
};

const EXT_MAP: Record<string, AttachmentType> = {
  ".png": "image",
  ".jpg": "image",
  ".jpeg": "image",
  ".webp": "image",
  ".gif": "image",
  ".pdf": "pdf",
  ".txt": "text",
  ".md": "markdown",
  ".json": "json",
  ".csv": "csv",
};

export function resolveAttachmentType(
  mimeType: string,
  fileName: string,
): AttachmentType {
  if (MIME_MAP[mimeType]) return MIME_MAP[mimeType];
  const ext = fileName.substring(fileName.lastIndexOf(".")).toLowerCase();
  return EXT_MAP[ext] ?? "unknown";
}

/** Max file size in bytes (10MB) */
export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;

/** Supported MIME types for drag & drop / file picker */
export const SUPPORTED_MIME_TYPES = Object.keys(MIME_MAP);

/** Supported file extensions for the file picker */
export const SUPPORTED_EXTENSIONS = Object.keys(EXT_MAP);
