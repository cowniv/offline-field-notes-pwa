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
