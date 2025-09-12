export interface DownloadTicket {
  ticket: string;
  wait_time: number;
  valid_until: string;
}

export interface DownloadLink {
  name: string;
  size: number;
  url: string;
}

export interface FileInfo {
  id: string;
  name: string;
  size: number;
  mime_type?: string;
  converted: boolean;
  status: number;
}

export interface ListedFolder {
  id: string;
  name: string;
}

export interface ListedFile {
  name: string;
  size: number;
  link: string;
  created_at: number;
  downloads: number;
  linkid: string;
  status?: string;
}

export interface FolderContent {
  folders: ListedFolder[];
  files: ListedFile[];
}

export interface UploadURL {
  url: string;
  valid_until: string;
}

export interface RemoteUploadAdd {
  id: string;
  folderid: string;
}

export interface RemoteUploadStatus {
  id: string;
  remoteurl: string;
  status: string;
  bytes_loaded?: number | null;
  bytes_total?: number | null;
  folderid: string;
  added: string;
  last_update: string;
  extid?: string | boolean | null;
  linkid?: string | null;
  url?: string | boolean | null;
}

export interface CreateFolderResponse {
  folderid: string;
}