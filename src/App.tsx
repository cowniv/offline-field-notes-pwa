import { useCallback, useEffect, useRef, useState } from "react";
import { ConflictsView } from "./ConflictsView";
import {
  listConflicts,
  listNotes,
  listOutbox,
  removeConflict,
  saveLocalEdit,
} from "./db";
import { exportCSV, exportJSON } from "./export";
import { NoteEditor } from "./NoteEditor";
import { syncOnce } from "./sync/sync";
import type { Conflict, LocalNote } from "./types";
import { useOnline } from "./useOnline";

type View = "notes" | "conflicts";

function newNote(): LocalNote {
  return {
    id: crypto.randomUUID(),
    title: "",
    body: "",
    location: "",
    checklist: [],
    updatedAt: Date.now(),
    deleted: false,
    syncedAt: 0,
  };
}

export default function App() {
  const online = useOnline();
  const [notes, setNotes] = useState<LocalNote[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [pending, setPending] = useState(0);
  const [selected, setSelected] = useState<LocalNote | null>(null);
  const [view, setView] = useState<View>("notes");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("");
  const syncing = useRef(false);

  const refresh = useCallback(async () => {
    setNotes(await listNotes());
    setConflicts(await listConflicts());
    setPending(new Set((await listOutbox()).map((e) => e.noteId)).size);
  }, []);

  const sync = useCallback(async () => {
    if (syncing.current || !navigator.onLine) return;
    syncing.current = true;
    setStatus("Syncing…");
    try {
      const r = await syncOnce();
      setStatus(
        `Synced ${new Date().toLocaleTimeString()} · ${r.pushed} sent, ${r.pulled} received` +
          (r.conflicts ? ` · ${r.conflicts} conflict(s)` : ""),
      );
    } catch {
      setStatus("Sync server unreachable. Your notes are safe on this device.");
    } finally {
      syncing.current = false;
      await refresh();
    }
  }, [refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // sync when we come back online, and every 30s while online
  useEffect(() => {
    if (!online) return;
    sync();
    const t = setInterval(sync, 30_000);
    return () => clearInterval(t);
  }, [online, sync]);

  async function save(note: LocalNote) {
    const saved = { ...note, updatedAt: Date.now() };
    await saveLocalEdit(saved);
    setSelected(saved.deleted ? null : saved);
    await refresh();
    if (navigator.onLine) sync();
  }

