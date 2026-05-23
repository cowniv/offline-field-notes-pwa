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
