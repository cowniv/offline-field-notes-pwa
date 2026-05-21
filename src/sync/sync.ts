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
