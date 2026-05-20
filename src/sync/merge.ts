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
