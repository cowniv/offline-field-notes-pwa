import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import { applyPush } from "../src/sync/merge";
import type { Note } from "../src/types";

/**
 * Tiny sync server. Stores every note with a monotonically increasing
 * `rev` so clients can pull "everything since rev N". Data lives in a JSON
 * file next to this script, which is plenty for a demo.
 */
interface Stored {
  note: Note;
  rev: number;
}
interface ServerConflict {
  noteId: string;
  overwritten: Note;
  at: number;
}

if (existsSync(".env")) process.loadEnvFile(".env");

const DATA_FILE = fileURLToPath(new URL("./data.json", import.meta.url));
const PORT = Number(process.env.PORT ?? 4300);
const TOKEN = process.env.SYNC_TOKEN ?? "";

let state: {
  rev: number;
  notes: Record<string, Stored>;
  conflicts: ServerConflict[];
} = {
  rev: 0,
  notes: {},
  conflicts: [],
};
if (existsSync(DATA_FILE)) state = JSON.parse(readFileSync(DATA_FILE, "utf8"));
const persist = () => writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));

function isNote(x: unknown): x is Note {
  const n = x as Note;
  return (
    !!n &&
    typeof n.id === "string" &&
    typeof n.title === "string" &&
    typeof n.body === "string" &&
    typeof n.location === "string" &&
    Array.isArray(n.checklist) &&
    typeof n.updatedAt === "number" &&
    typeof n.deleted === "boolean"
  );
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.use("/api", (req, res, next) => {
  if (TOKEN && req.header("x-sync-token") !== TOKEN) {
    res.status(401).json({ error: "bad sync token" });
    return;
  }
  next();
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, rev: state.rev });
});

app.post("/api/sync/push", (req, res) => {
  const changes = req.body?.changes;
  if (!Array.isArray(changes) || changes.length > 500) {
    res
      .status(400)
      .json({ error: "changes must be an array of up to 500 items" });
    return;
  }
  const results = [];
  for (const c of changes) {
    if (!isNote(c?.note) || typeof c.baseSyncedAt !== "number") {
      res.status(400).json({ error: "invalid change" });
      return;
    }
    const existing = state.notes[c.note.id]?.note;
    const out = applyPush(existing, c.note, c.baseSyncedAt);
    if (out.result.status === "accepted") {
      state.rev += 1;
      state.notes[c.note.id] = { note: c.note, rev: state.rev };
    }
    if (out.overwritten) {
      state.conflicts.push({
        noteId: c.note.id,
        overwritten: out.overwritten,
        at: Date.now(),
      });
    }
    results.push(out.result);
  }
