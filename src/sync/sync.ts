import {
  addConflict,
  clearOutboxFor,
  getCursor,
  getNote,
  listOutbox,
  putNote,
  setCursor,
} from "../db";
import type { LocalNote, Note, PushResult } from "../types";
import { dedupeOutbox, mergeRemote, stripLocal } from "./merge";

const headers: Record<string, string> = { "Content-Type": "application/json" };
const token = import.meta.env.VITE_SYNC_TOKEN as string | undefined;
if (token) headers["x-sync-token"] = token;

export interface SyncReport {
  pushed: number;
  pulled: number;
  conflicts: number;
}

const toLocal = (n: Note): LocalNote => ({ ...n, syncedAt: n.updatedAt });

/**
 * One sync round: push the outbox, then pull everything that changed on the
 * server since our cursor. IndexedDB stays the source of truth; the server is
 * just a meeting point between devices.
 */
export async function syncOnce(): Promise<SyncReport> {
  const report: SyncReport = { pushed: 0, pulled: 0, conflicts: 0 };

  // 1. push
  const outbox = await listOutbox();
  const ids = dedupeOutbox(outbox);
  const payload: { note: Note; baseSyncedAt: number }[] = [];
  for (const id of ids) {
    const n = await getNote(id);
    if (n) payload.push({ note: stripLocal(n), baseSyncedAt: n.syncedAt });
  }
  if (payload.length) {
    const res = await fetch("/api/sync/push", {
      method: "POST",
      headers,
      body: JSON.stringify({ changes: payload }),
    });
    if (!res.ok) throw new Error(`push failed (${res.status})`);
    const { results } = (await res.json()) as { results: PushResult[] };
    for (const r of results) {
      const local = await getNote(r.noteId);
      if (!local) continue;
      if (r.status === "rejected") {
