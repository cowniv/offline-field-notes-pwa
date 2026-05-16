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
