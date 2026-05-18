import { stripLocal } from "./sync/merge";
import type { LocalNote } from "./types";

function download(name: string, type: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const stamp = () => new Date().toISOString().slice(0, 10);

export function exportJSON(notes: LocalNote[]) {
  const data = notes.map((n) => ({ ...stripLocal(n), hasPhoto: !!n.photo }));
  download(
    `field-notes-${stamp()}.json`,
    "application/json",
