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

  async function keepLost(c: Conflict) {
    const current = notes.find((n) => n.id === c.noteId);
    await saveLocalEdit({
      ...(current ?? { syncedAt: 0 }),
      ...c.lost,
      deleted: false,
      updatedAt: Date.now(),
    } as LocalNote);
    await removeConflict(c.id);
    await refresh();
    sync();
  }

  async function dismiss(c: Conflict) {
    await removeConflict(c.id);
    await refresh();
  }

  const q = query.trim().toLowerCase();
  const visible = q
    ? notes.filter((n) =>
        `${n.title} ${n.location} ${n.body}`.toLowerCase().includes(q),
      )
    : notes;

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col">
      <header className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-stone-200 bg-paper/95 px-4 py-3 backdrop-blur">
        <h1 className="text-lg font-bold text-forest">Field Notes</h1>
        <span
          role="status"
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            online
              ? "bg-forest-light text-forest"
              : "bg-amber-100 text-amber-800"
          }`}
        >
          {online ? "● Online" : "○ Offline"}
        </span>
        {pending > 0 && (
          <span className="text-xs text-stone-600">
            {pending} waiting to sync
          </span>
        )}
        <nav className="ml-auto flex gap-2">
          <button
            type="button"
            className={`btn ${view === "notes" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setView("notes")}
          >
            Notes
          </button>
          <button
            type="button"
            className={`btn ${view === "conflicts" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setView("conflicts")}
          >
            Conflicts{conflicts.length ? ` (${conflicts.length})` : ""}
          </button>
        </nav>
      </header>

      {status && <p className="px-4 pt-2 text-xs text-stone-500">{status}</p>}

      {view === "conflicts" ? (
        <ConflictsView
          conflicts={conflicts}
          onKeepLost={keepLost}
          onDismiss={dismiss}
        />
      ) : (
        <main className="grid flex-1 gap-4 p-4 md:grid-cols-[280px_1fr]">
          <aside className="flex flex-col gap-3">
            <div className="flex gap-2">
              <button
                type="button"
                className="btn btn-primary flex-1"
                onClick={() => setSelected(newNote())}
              >
                + New note
              </button>
              <button
                type="button"
                className="btn btn-ghost"
