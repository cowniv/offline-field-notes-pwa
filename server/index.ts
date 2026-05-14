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
