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
    );
  });
  it("is deterministic on ties", () => {
    const a = v({ title: "A" });
    const b = v({ title: "B" });
    expect(pickWinner(a, b)).toBe(pickWinner(b, a));
  });
});

describe("applyPush (server)", () => {
  it("accepts a brand new note", () => {
    const out = applyPush(undefined, base, 0);
    expect(out.result.status).toBe("accepted");
    expect(out.overwritten).toBeUndefined();
  });

  it("accepts a fast-forward edit without a conflict", () => {
    const out = applyPush(base, v({ body: "done", updatedAt: 2000 }), 1000);
    expect(out.result.status).toBe("accepted");
    expect(out.overwritten).toBeUndefined();
  });

  it("flags a conflict when a newer concurrent edit overwrites another", () => {
    const server = v({ body: "from tablet", updatedAt: 2000 });
    const incoming = v({ body: "from phone", updatedAt: 3000 });
    const out = applyPush(server, incoming, 1000);
    expect(out.result.status).toBe("accepted");
    expect(out.overwritten?.body).toBe("from tablet");
  });

  it("rejects an older concurrent edit and reports it as lost", () => {
    const server = v({ body: "from tablet", updatedAt: 3000 });
    const incoming = v({ body: "from phone", updatedAt: 2000 });
    const out = applyPush(server, incoming, 1000);
    expect(out.result.status).toBe("rejected");
    expect(out.result.current.body).toBe("from tablet");
    expect(out.overwritten?.body).toBe("from phone");
  });

  it("does not flag identical concurrent edits", () => {
    const server = v({ body: "same", updatedAt: 2000 });
    const out = applyPush(server, v({ body: "same", updatedAt: 2500 }), 1000);
    expect(out.overwritten).toBeUndefined();
  });
});

describe("mergeRemote (client)", () => {
  it("inserts unknown notes", () => {
    const out = mergeRemote<L>(undefined, base, false, toLocal);
    expect(out.next.syncedAt).toBe(1000);
  });

  it("overwrites clean local copies", () => {
    const out = mergeRemote<L>(
      toLocal(base),
      v({ title: "New", updatedAt: 2000 }),
      false,
      toLocal,
    );
    expect(out.next.title).toBe("New");
    expect(out.lostLocal).toBeUndefined();
  });

