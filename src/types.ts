export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

/** The part of a note that travels to the sync server. Photos stay on the device. */
export interface Note {
  id: string;
  title: string;
  body: string;
  location: string;
  checklist: ChecklistItem[];
  /** epoch ms of the last local edit; drives last-write-wins */
  updatedAt: number;
  deleted: boolean;
}

export interface LocalNote extends Note {
  /** updatedAt of the version we last saw from the server (0 = never synced) */
  syncedAt: number;
  photo?: Blob;
}

export interface OutboxEntry {
  seq?: number;
  noteId: string;
  queuedAt: number;
}

export interface Conflict {
  id: string;
