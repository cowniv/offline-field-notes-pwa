export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

/** The part of a note that travels to the sync server. Photos stay on the device. */
export interface Note {
