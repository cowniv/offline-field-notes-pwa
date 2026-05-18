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
          className="input"
          placeholder="e.g. Brgy. 412, Sampaloc"
          value={draft.location}
          onChange={(e) => set("location", e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Notes
        <textarea
          className="input min-h-32"
          value={draft.body}
          onChange={(e) => set("body", e.target.value)}
        />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">Checklist</legend>
        {draft.checklist.map((item) => (
          <div key={item.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              id={item.id}
              checked={item.done}
              className="size-4 accent-forest"
              onChange={(e) =>
                set(
                  "checklist",
                  draft.checklist.map((c) =>
                    c.id === item.id ? { ...c, done: e.target.checked } : c,
                  ),
                )
              }
