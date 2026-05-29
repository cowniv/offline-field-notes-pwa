import { describe, expect, it } from "vitest";
import type { Note } from "../types";
import { applyPush, dedupeOutbox, mergeRemote, pickWinner } from "./merge";

const base: Note = {
  id: "n1",
  title: "Barangay 412 survey",
  body: "",
  location: "Sampaloc",
  checklist: [],
  updatedAt: 1000,
  deleted: false,
};
const v = (patch: Partial<Note>): Note => ({ ...base, ...patch });
type L = Note & { syncedAt: number };
const toLocal = (n: Note): L => ({ ...n, syncedAt: n.updatedAt });

describe("pickWinner", () => {
  it("picks the newer edit", () => {
    expect(pickWinner(v({ updatedAt: 1 }), v({ updatedAt: 2 })).updatedAt).toBe(
      2,
