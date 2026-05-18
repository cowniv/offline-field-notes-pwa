import { type DBSchema, type IDBPDatabase, openDB } from "idb";
import type { Conflict, LocalNote, OutboxEntry } from "./types";

interface FieldNotesDB extends DBSchema {
  notes: { key: string; value: LocalNote; indexes: { byUpdated: number } };
  outbox: { key: number; value: OutboxEntry };
  conflicts: { key: string; value: Conflict };
  meta: { key: string; value: number };
}

let dbPromise: Promise<IDBPDatabase<FieldNotesDB>> | null = null;

export function getDB() {
  dbPromise ??= openDB<FieldNotesDB>("field-notes", 1, {
    upgrade(db) {
      const notes = db.createObjectStore("notes", { keyPath: "id" });
      notes.createIndex("byUpdated", "updatedAt");
      db.createObjectStore("outbox", { keyPath: "seq", autoIncrement: true });
      db.createObjectStore("conflicts", { keyPath: "id" });
      db.createObjectStore("meta");
    },
  });
  return dbPromise;
}

export async function listNotes(): Promise<LocalNote[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex("notes", "byUpdated");
  return all.filter((n) => !n.deleted).reverse();
}

export async function getNote(id: string) {
  return (await getDB()).get("notes", id);
}

/** Save a local edit and queue it for sync in one transaction. */
export async function saveLocalEdit(note: LocalNote) {
  const db = await getDB();
  const tx = db.transaction(["notes", "outbox"], "readwrite");
  await tx.objectStore("notes").put(note);
  await tx.objectStore("outbox").add({ noteId: note.id, queuedAt: Date.now() });
  await tx.done;
}

export async function putNote(note: LocalNote) {
  await (await getDB()).put("notes", note);
}

export async function listOutbox() {
  return (await getDB()).getAll("outbox");
}

export async function clearOutboxFor(noteIds: string[]) {
  const db = await getDB();
  const tx = db.transaction("outbox", "readwrite");
  let cursor = await tx.store.openCursor();
