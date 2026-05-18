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
