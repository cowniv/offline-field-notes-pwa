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
                onClick={sync}
                disabled={!online}
                title="Sync now"
              >
                ⟳
              </button>
            </div>
            <input
              className="input"
              placeholder="Search notes"
              aria-label="Search notes"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <ul className="flex flex-col gap-1.5">
              {visible.map((n) => {
                const done = n.checklist.filter((c) => c.done).length;
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(n)}
                      className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                        selected?.id === n.id
                          ? "border-forest bg-forest-light"
                          : "border-stone-200 bg-white hover:border-stone-300"
                      }`}
                    >
                      <span className="block truncate font-medium">
                        {n.title || "Untitled"}
                      </span>
                      <span className="block truncate text-xs text-stone-500">
                        {n.location || "No location"}
                        {n.checklist.length > 0 &&
                          ` · ${done}/${n.checklist.length}`}
                        {n.photo && " · 📷"}
                        {n.syncedAt < n.updatedAt && " · unsynced"}
                      </span>
                    </button>
                  </li>
                );
              })}
              {visible.length === 0 && (
                <li className="text-sm text-stone-500">No notes yet.</li>
              )}
            </ul>
            <div className="mt-auto flex gap-2 pt-4">
              <button
                type="button"
                className="btn btn-ghost flex-1"
                onClick={() => exportJSON(notes)}
                disabled={!notes.length}
              >
                Export JSON
              </button>
              <button
                type="button"
                className="btn btn-ghost flex-1"
                onClick={() => exportCSV(notes)}
                disabled={!notes.length}
              >
                Export CSV
              </button>
            </div>
          </aside>
          <section>
            {selected ? (
              <NoteEditor
                key={selected.id + selected.updatedAt}
                note={selected}
                onSave={save}
              />
            ) : (
              <div className="grid h-full place-items-center rounded-xl border border-dashed border-stone-300 p-10 text-center text-sm text-stone-500">
                Pick a note or start a new one. Everything saves to this device
                first, so it works with no signal.
              </div>
            )}
          </section>
        </main>
      )}
    </div>
  );
}
