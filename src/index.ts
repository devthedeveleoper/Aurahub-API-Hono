import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { swaggerUI } from '@hono/swagger-ui';
import { cors } from 'hono/cors';
import { makeStreamtapeRequest } from './client';
import * as Schemas from './schemas';

type Env = {
  STREAMTAPE_API_LOGIN: string;
  STREAMTAPE_API_KEY: string;
};

const app = new OpenAPIHono<{ Bindings: Env }>();

app.use('*', cors());

// Helper for JSON content description
const jsonContent = <T extends z.ZodType>(schema: T, description: string) => ({
  content: { 'application/json': { schema } },
  description,
});

// ==========================================
// 1. STREAM & DOWNLOAD ROUTES
// ==========================================

const streamInfoRoute = createRoute({
  method: 'get',
  path: '/stream/info',
  tags: ['Stream'],
  request: {
    query: z.object({
      file_ids: z.string().openapi({ param: { name: 'file_ids', in: 'query' }, example: 'file1,file2' }),
    }),
  },
  responses: {
    // FIX: Explicitly define key as z.string()
    200: jsonContent(z.record(z.string(), Schemas.FileInfoSchema), 'File Information'),
  },
});

app.openapi(streamInfoRoute, async (c) => {
  const { file_ids } = c.req.valid('query');
  // FIX: Infer the return type from the Zod schema
  const result = await makeStreamtapeRequest<Record<string, z.infer<typeof Schemas.FileInfoSchema>>>(c, '/file/info', { file: file_ids });
  return c.json(result);
});

const ticketRoute = createRoute({
  method: 'get',
  path: '/stream/ticket/{file_id}',
  tags: ['Stream'],
  request: {
    params: z.object({ file_id: z.string() }),
  },
  responses: {
    200: jsonContent(Schemas.DownloadTicketSchema, 'Download Ticket'),
  },
});

app.openapi(ticketRoute, async (c) => {
  const { file_id } = c.req.valid('param');
  // FIX: Pass generic type
  const result = await makeStreamtapeRequest<z.infer<typeof Schemas.DownloadTicketSchema>>(c, '/file/dlticket', { file: file_id });
  return c.json(result);
});

const linkRoute = createRoute({
  method: 'get',
  path: '/stream/link',
  tags: ['Stream'],
  request: {
    query: z.object({
      file_id: z.string(),
      ticket: z.string(),
    }),
  },
  responses: {
    200: jsonContent(Schemas.DownloadLinkSchema, 'Download Link'),
  },
});

app.openapi(linkRoute, async (c) => {
  const { file_id, ticket } = c.req.valid('query');
  // FIX: Pass generic type
  const result = await makeStreamtapeRequest<z.infer<typeof Schemas.DownloadLinkSchema>>(c, '/file/dl', { file: file_id, ticket });
  return c.json(result);
});

// ==========================================
// 2. UPLOAD ROUTE
// ==========================================

const uploadUrlRoute = createRoute({
  method: 'get',
  path: '/upload/url',
  tags: ['Upload'],
  request: {
    query: z.object({
      folder: z.string().optional(),
      sha256: z.string().optional(),
    }),
  },
  responses: {
    200: jsonContent(Schemas.UploadURLSchema, 'Upload URL'),
  },
});

app.openapi(uploadUrlRoute, async (c) => {
  const query = c.req.valid('query');
  // FIX: Pass generic type and cast params
  const result = await makeStreamtapeRequest<z.infer<typeof Schemas.UploadURLSchema>>(c, '/file/ul', query as Record<string, string>);
  return c.json(result);
});

// ==========================================
// 3. REMOTE UPLOAD ROUTES
// ==========================================

const addRemoteRoute = createRoute({
  method: 'get',
  path: '/remote/add',
  tags: ['Remote Upload'],
  request: {
    query: z.object({
      url: z.string(),
      folder: z.string(),
      name: z.string().optional(),
    }),
  },
  responses: {
    202: jsonContent(Schemas.RemoteUploadAddSchema, 'Remote Upload Added'),
  },
});

app.openapi(addRemoteRoute, async (c) => {
  const query = c.req.valid('query');
  const result = await makeStreamtapeRequest<z.infer<typeof Schemas.RemoteUploadAddSchema>>(c, '/remotedl/add', query as Record<string, string>);
  return c.json(result, 202);
});

const removeRemoteRoute = createRoute({
  method: 'delete',
  path: '/remote/remove/{upload_id}',
  tags: ['Remote Upload'],
  request: {
    params: z.object({ upload_id: z.string() }),
  },
  responses: {
    200: jsonContent(Schemas.SuccessResponseSchema, 'Upload Removed'),
  },
});

app.openapi(removeRemoteRoute, async (c) => {
  const { upload_id } = c.req.valid('param');
  // FIX: Boolean return type
  const result = await makeStreamtapeRequest<boolean>(c, '/remotedl/remove', { id: upload_id });
  return c.json({ success: !!result });
});

const statusRemoteRoute = createRoute({
  method: 'get',
  path: '/remote/status',
  tags: ['Remote Upload'],
  request: {
    query: z.object({
      id: z.string(),
      limit: z.string().optional(),
    }),
  },
  responses: {
    // FIX: Explicitly define key as z.string()
    200: jsonContent(z.record(z.string(), Schemas.RemoteUploadStatusSchema), 'Remote Upload Status'),
  },
});

app.openapi(statusRemoteRoute, async (c) => {
  const query = c.req.valid('query');
  const result = await makeStreamtapeRequest<Record<string, z.infer<typeof Schemas.RemoteUploadStatusSchema>>>(c, '/remotedl/status', query as Record<string, string>);
  return c.json(result);
});

// ==========================================
// 4. FILE & FOLDER MANAGEMENT
// ==========================================

const listFolderRoute = createRoute({
  method: 'get',
  path: '/fs/list/{folder_id}',
  tags: ['File System'],
  request: {
    params: z.object({ folder_id: z.string().default('root') }),
  },
  responses: {
    200: jsonContent(Schemas.FolderContentSchema, 'Folder Contents'),
  },
});

app.openapi(listFolderRoute, async (c) => {
  const { folder_id } = c.req.valid('param');
  const result = await makeStreamtapeRequest<z.infer<typeof Schemas.FolderContentSchema>>(c, '/file/listfolder', { folder: folder_id });
  return c.json(result);
});

const createFolderRoute = createRoute({
  method: 'post',
  path: '/fs/folders/create',
  tags: ['File System'],
  request: {
    query: z.object({
      name: z.string(),
      pid: z.string().optional(),
    }),
  },
  responses: {
    200: jsonContent(Schemas.CreateFolderResponseSchema, 'Folder Created'),
  },
});

app.openapi(createFolderRoute, async (c) => {
  const query = c.req.valid('query');
  const result = await makeStreamtapeRequest<z.infer<typeof Schemas.CreateFolderResponseSchema>>(c, '/file/createfolder', query as Record<string, string>);
  return c.json(result);
});

const renameFolderRoute = createRoute({
  method: 'patch',
  path: '/fs/folders/rename/{folder_id}',
  tags: ['File System'],
  request: {
    params: z.object({ folder_id: z.string() }),
    query: z.object({ name: z.string() }),
  },
  responses: {
    200: jsonContent(Schemas.SuccessResponseSchema, 'Folder Renamed'),
  },
});

app.openapi(renameFolderRoute, async (c) => {
  const { folder_id } = c.req.valid('param');
  const { name } = c.req.valid('query');
  const result = await makeStreamtapeRequest<boolean>(c, '/file/renamefolder', { folder: folder_id, name });
  return c.json({ success: !!result });
});

const deleteFolderRoute = createRoute({
  method: 'delete',
  path: '/fs/folders/delete/{folder_id}',
  tags: ['File System'],
  request: {
    params: z.object({ folder_id: z.string() }),
  },
  responses: {
    200: jsonContent(Schemas.SuccessResponseSchema, 'Folder Deleted'),
  },
});

app.openapi(deleteFolderRoute, async (c) => {
  const { folder_id } = c.req.valid('param');
  const result = await makeStreamtapeRequest<boolean>(c, '/file/deletefolder', { folder: folder_id });
  return c.json({ success: !!result });
});

const renameFileRoute = createRoute({
  method: 'patch',
  path: '/fs/files/rename/{file_id}',
  tags: ['File System'],
  request: {
    params: z.object({ file_id: z.string() }),
    query: z.object({ name: z.string() }),
  },
  responses: {
    200: jsonContent(Schemas.SuccessResponseSchema, 'File Renamed'),
  },
});

app.openapi(renameFileRoute, async (c) => {
  const { file_id } = c.req.valid('param');
  const { name } = c.req.valid('query');
  const result = await makeStreamtapeRequest<boolean>(c, '/file/rename', { file: file_id, name });
  return c.json({ success: !!result });
});

const moveFileRoute = createRoute({
  method: 'patch',
  path: '/fs/files/move/{file_id}',
  tags: ['File System'],
  request: {
    params: z.object({ file_id: z.string() }),
    query: z.object({ folder: z.string() }),
  },
  responses: {
    200: jsonContent(Schemas.SuccessResponseSchema, 'File Moved'),
  },
});

app.openapi(moveFileRoute, async (c) => {
  const { file_id } = c.req.valid('param');
  const { folder } = c.req.valid('query');
  const result = await makeStreamtapeRequest<boolean>(c, '/file/move', { file: file_id, folder });
  return c.json({ success: !!result });
});

const deleteFileRoute = createRoute({
  method: 'delete',
  path: '/fs/files/delete/{file_id}',
  tags: ['File System'],
  request: {
    params: z.object({ file_id: z.string() }),
  },
  responses: {
    200: jsonContent(Schemas.SuccessResponseSchema, 'File Deleted'),
  },
});

app.openapi(deleteFileRoute, async (c) => {
  const { file_id } = c.req.valid('param');
  const result = await makeStreamtapeRequest<boolean>(c, '/file/delete', { file: file_id });
  return c.json({ success: !!result });
});

const thumbRoute = createRoute({
  method: 'get',
  path: '/fs/files/thumbnail/{file_id}',
  tags: ['File System'],
  request: {
    params: z.object({ file_id: z.string() }),
  },
  responses: {
    200: jsonContent(Schemas.ThumbnailSchema, 'Thumbnail URL'),
  },
});

app.openapi(thumbRoute, async (c) => {
  const { file_id } = c.req.valid('param');
  const result = await makeStreamtapeRequest<string>(c, '/file/getsplash', { file: file_id });
  return c.json({ thumbnail_url: result });
});

// ==========================================
// SWAGGER UI CONFIGURATION
// ==========================================

app.doc('/doc', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'Streamtape Wrapper API',
    description: 'A production-grade wrapper for Streamtape running on Cloudflare Workers.',
  },
});

app.get('/docs', swaggerUI({ url: '/doc' }));

app.get('/', (c) => c.text('Go to /docs for API Documentation'));

export default app;