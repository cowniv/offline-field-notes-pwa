import { useEffect, useMemo, useState } from "react";
import type { LocalNote } from "./types";

interface Props {
  note: LocalNote;
  onSave: (n: LocalNote) => void;
}

export function NoteEditor({ note, onSave }: Props) {
  const [draft, setDraft] = useState<LocalNote>(note);
  const [newItem, setNewItem] = useState("");
  const photoUrl = useMemo(
    () => (draft.photo ? URL.createObjectURL(draft.photo) : null),
    [draft.photo],
  );
  useEffect(
    () => () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    },
    [photoUrl],
  );

  const set = <K extends keyof LocalNote>(k: K, v: LocalNote[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  function addItem() {
    const text = newItem.trim();
    if (!text) return;
    set("checklist", [
      ...draft.checklist,
      { id: crypto.randomUUID(), text, done: false },
    ]);
    setNewItem("");
