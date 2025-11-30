import { z } from '@hono/zod-openapi';

// --- Shared Schemas ---
export const SuccessResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
});

export const ErrorSchema = z.object({
  success: z.boolean().default(false),
  message: z.string(),
});

// --- Stream & Download ---
export const FileInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  size: z.number(),
  mime_type: z.string().optional(),
  converted: z.boolean(),
  status: z.number(),
});

export const DownloadTicketSchema = z.object({
  ticket: z.string(),
  wait_time: z.number(),
  valid_until: z.string(),
});

export const DownloadLinkSchema = z.object({
  name: z.string(),
  size: z.number(),
  url: z.string(),
});

// --- Upload ---
export const UploadURLSchema = z.object({
  url: z.string(),
  valid_until: z.string(),
});

// --- Remote Upload ---
export const RemoteUploadAddSchema = z.object({
  id: z.string(),
  folderid: z.string(),
});

export const RemoteUploadStatusSchema = z.object({
  id: z.string(),
  remoteurl: z.string(),
  status: z.string(),
  bytes_loaded: z.number().nullable().optional(),
  bytes_total: z.number().nullable().optional(),
  folderid: z.string(),
  added: z.string(),
  last_update: z.string(),
  extid: z.union([z.string(), z.boolean()]).nullable().optional(),
  linkid: z.string().nullable().optional(),
  url: z.union([z.string(), z.boolean()]).nullable().optional(),
});

// --- File & Folder ---
export const ListedFolderSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const ListedFileSchema = z.object({
  name: z.string(),
  size: z.number(),
  link: z.string(),
  created_at: z.number(),
  downloads: z.number(),
  linkid: z.string(),
  status: z.string().optional(),
});

export const FolderContentSchema = z.object({
  folders: z.array(ListedFolderSchema),
  files: z.array(ListedFileSchema),
});

export const CreateFolderResponseSchema = z.object({
  folderid: z.string(),
});

export const ThumbnailSchema = z.object({
  thumbnail_url: z.string(),
});