import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { makeStreamtapeRequest } from './client';
import type {
  DownloadTicket,
  DownloadLink,
  FileInfo,
  UploadURL,
  RemoteUploadAdd,
  RemoteUploadStatus,
  FolderContent,
  CreateFolderResponse,
} from './types';

type Env = {
  STREAMTAPE_API_LOGIN: string;
  STREAMTAPE_API_KEY: string;
};

const app = new Hono<{ Bindings: Env }>();

const createSuccessResponse = (result: any) => ({ success: !!result });

// --- Stream & Download Routes ---

app.get('/stream/info', async (c) => {
  const fileIds = c.req.query('file_ids');
  if (!fileIds) {
    throw new HTTPException(400, { message: 'Query parameter "file_ids" is required.' });
  }
  const result = await makeStreamtapeRequest<Record<string, FileInfo>>(c, '/file/info', {
    file: fileIds,
  });
  return c.json(result);
});

app.get('/stream/ticket/:file_id', async (c) => {
  const fileId = c.req.param('file_id');
  const result = await makeStreamtapeRequest<DownloadTicket>(c, '/file/dlticket', {
    file: fileId,
  });
  return c.json(result);
});

app.get('/stream/link', async (c) => {
  const fileId = c.req.query('file_id');
  const ticket = c.req.query('ticket');
  if (!fileId || !ticket) {
    throw new HTTPException(400, { message: 'Query parameters "file_id" and "ticket" are required.' });
  }
  const result = await makeStreamtapeRequest<DownloadLink>(c, '/file/dl', {
    file: fileId,
    ticket: ticket,
  });
  return c.json(result);
});

// --- Upload Route ---

app.get('/upload/url', async (c) => {
  const params: Record<string, string> = {};
  const folder = c.req.query('folder');
  const sha256 = c.req.query('sha256');

  if (folder) params.folder = folder;
  if (sha256) params.sha256 = sha256;

  const result = await makeStreamtapeRequest<UploadURL>(c, '/file/ul', params);
  return c.json(result);
});

// --- Remote Upload Routes ---

app.get('/remote/add', async (c) => {
  const url = c.req.query('url');
  const folderId = c.req.query('folder');

  if (!url || !folderId) {
    throw new HTTPException(400, { message: 'Query parameters "url" and "folder" are required.' });
  }

  const params: Record<string, string> = { url, folder: folderId };
  const name = c.req.query('name');
  if (name) params.name = name;
  
  const result = await makeStreamtapeRequest<RemoteUploadAdd>(c, '/remotedl/add', params);
  return c.json(result, 202);
});

app.delete('/remote/remove/:upload_id', async (c) => {
  const uploadId = c.req.param('upload_id');
  const result = await makeStreamtapeRequest<boolean>(c, '/remotedl/remove', { id: uploadId });
  return c.json(createSuccessResponse(result));
});

app.get('/remote/status', async (c) => {
  const uploadId = c.req.query('id');
  if (!uploadId) {
    throw new HTTPException(400, { message: 'Query parameter "id" is required.' });
  }
  const params: Record<string, string> = { id: uploadId };
  const limit = c.req.query('limit');
  if (limit) params.limit = limit;

  const result = await makeStreamtapeRequest<Record<string, RemoteUploadStatus>>(c, '/remotedl/status', params);
  return c.json(result);
});

// --- File & Folder Management Routes ---

app.get('/fs/list/:folder_id', async (c) => {
  const folderId = c.req.param('folder_id');
  const result = await makeStreamtapeRequest<FolderContent>(c, '/file/listfolder', { folder: folderId });
  return c.json(result);
});

app.post('/fs/folders/create', async (c) => {
  const name = c.req.query('name');
  if (!name) {
    throw new HTTPException(400, { message: 'Query parameter "name" is required.' });
  }
  const params: Record<string, string> = { name };
  const parentId = c.req.query('pid');
  if (parentId) params.pid = parentId;

  const result = await makeStreamtapeRequest<CreateFolderResponse>(c, '/file/createfolder', params);
  return c.json(result);
});

app.patch('/fs/folders/rename/:folder_id', async (c) => {
  const folderId = c.req.param('folder_id');
  const name = c.req.query('name');
  if (!name) {
    throw new HTTPException(400, { message: 'Query parameter "name" is required.' });
  }
  const result = await makeStreamtapeRequest<boolean>(c, '/file/renamefolder', { folder: folderId, name });
  return c.json(createSuccessResponse(result));
});

app.delete('/fs/folders/delete/:folder_id', async (c) => {
  const folderId = c.req.param('folder_id');
  const result = await makeStreamtapeRequest<boolean>(c, '/file/deletefolder', { folder: folderId });
  return c.json(createSuccessResponse(result));
});

app.patch('/fs/files/rename/:file_id', async (c) => {
  const fileId = c.req.param('file_id');
  const name = c.req.query('name');
  if (!name) {
    throw new HTTPException(400, { message: 'Query parameter "name" is required.' });
  }
  const result = await makeStreamtapeRequest<boolean>(c, '/file/rename', { file: fileId, name });
  return c.json(createSuccessResponse(result));
});

app.patch('/fs/files/move/:file_id', async (c) => {
  const fileId = c.req.param('file_id');
  const folderId = c.req.query('folder');
  if (!folderId) {
    throw new HTTPException(400, { message: 'Query parameter "folder" (destination folder ID) is required.' });
  }
  const result = await makeStreamtapeRequest<boolean>(c, '/file/move', { file: fileId, folder: folderId });
  return c.json(createSuccessResponse(result));
});

app.delete('/fs/files/delete/:file_id', async (c) => {
  const fileId = c.req.param('file_id');
  const result = await makeStreamtapeRequest<boolean>(c, '/file/delete', { file: fileId });
  return c.json(createSuccessResponse(result));
});

app.get('/fs/files/thumbnail/:file_id', async (c) => {
  const fileId = c.req.param('file_id');
  const thumbnailUrl = await makeStreamtapeRequest<string>(c, '/file/getsplash', { file: fileId });
  return c.json({ thumbnail_url: thumbnailUrl });
});

// --- Welcome Endpoint ---
app.get('/', (c) => {
  return c.text('Welcome to the Streamtape Hono Wrapper!');
});

export default app;