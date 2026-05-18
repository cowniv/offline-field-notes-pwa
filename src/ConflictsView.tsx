import type { Conflict, Note } from "./types";

interface Props {
  conflicts: Conflict[];
  onKeepLost: (c: Conflict) => void;
  onDismiss: (c: Conflict) => void;
}

function Version({ label, note }: { label: string; note: Note }) {
  return (
    <div className="flex-1 rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-500">
        {label} · {new Date(note.updatedAt).toLocaleString()}
      </p>
      <p className="font-medium">
        {note.deleted ? "(deleted)" : note.title || "Untitled"}
      </p>
      {note.location && <p className="text-stone-600">{note.location}</p>}
      <p className="mt-1 whitespace-pre-wrap text-stone-700">{note.body}</p>
      {note.checklist.length > 0 && (
        <ul className="mt-1 text-stone-600">
          {note.checklist.map((c) => (
            <li key={c.id}>
              {c.done ? "☑" : "☐"} {c.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ConflictsView({ conflicts, onKeepLost, onDismiss }: Props) {
  return (
    <main className="flex flex-col gap-4 p-4">
      <p className="text-sm text-stone-600">
        When two devices edit the same note while apart, the newest edit wins.
        The older edit is kept here so nothing is lost silently.
      </p>
      {conflicts.length === 0 && (
        <p className="text-sm text-stone-500">No conflicts. 🎉</p>
      )}
      {conflicts.map((c) => (
        <article
          key={c.id}
          className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-white p-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <Version label="Kept" note={c.kept} />
            <Version label="Replaced" note={c.lost} />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onKeepLost(c)}
            >
              Restore replaced version
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => onDismiss(c)}
            >
              Keep current
            </button>
          </div>
        </article>
      ))}
    </main>
  );
}
