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
  }

  function onPhoto(file: File | undefined) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Photos up to 5 MB, please.");
      return;
    }
    // stored as a Blob in IndexedDB; File is a Blob so this keeps the bytes as-is
    set("photo", file);
  }

  return (
    <form
      className="flex flex-col gap-4 rounded-xl border border-stone-200 bg-white p-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(draft);
      }}
    >
      <label className="flex flex-col gap-1 text-sm font-medium">
        Title
        <input
          className="input"
          required
          value={draft.title}
          onChange={(e) => set("title", e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Location
        <input
