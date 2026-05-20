import type { Note, PushResult } from "../types";

/**
 * Last-write-wins: the higher updatedAt wins. Ties are broken by comparing
 * the serialized note so both sides always pick the same winner.
 */
export function pickWinner(a: Note, b: Note): Note {
  if (a.updatedAt !== b.updatedAt) return a.updatedAt > b.updatedAt ? a : b;
  return JSON.stringify(a) >= JSON.stringify(b) ? a : b;
}

export function sameContent(a: Note, b: Note): boolean {
  return (
    a.title === b.title &&
    a.body === b.body &&
    a.location === b.location &&
    a.deleted === b.deleted &&
    JSON.stringify(a.checklist) === JSON.stringify(b.checklist)
  );
}

export interface ServerPushOutcome {
  result: PushResult;
  /** set when two different edits collided and one was overwritten */
  overwritten?: Note;
}

/**
 * Server side: apply one incoming note against what the server has.
 * `baseSyncedAt` is the server version the client last saw. If the server
 * copy moved on since then, the two edits were concurrent.
 */
export function applyPush(
  existing: Note | undefined,
  incoming: Note,
  baseSyncedAt: number,
): ServerPushOutcome {
  if (!existing) {
    return {
      result: { noteId: incoming.id, status: "accepted", current: incoming },
    };
  }
  const concurrent =
    existing.updatedAt > baseSyncedAt && !sameContent(existing, incoming);
  const winner = pickWinner(existing, incoming);
  if (winner === incoming) {
    return {
      result: { noteId: incoming.id, status: "accepted", current: incoming },
      overwritten: concurrent ? existing : undefined,
    };
  }
  return {
    result: { noteId: incoming.id, status: "rejected", current: existing },
    overwritten: concurrent ? incoming : undefined,
  };
}

export interface LocalMergeOutcome<T extends Note> {
  /** what to store locally */
  next: T;
  /** set when a local unsynced edit lost to the remote one */
  lostLocal?: Note;
}

/**
 * Client side: fold a note pulled from the server into the local copy.
 * `hasPending` means the local copy has edits still waiting in the outbox.
 */
export function mergeRemote<T extends Note & { syncedAt: number }>(
  local: T | undefined,
  remote: Note,
  hasPending: boolean,
  makeLocal: (n: Note) => T,
): LocalMergeOutcome<T> {
