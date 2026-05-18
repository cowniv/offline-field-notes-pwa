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
    JSON.stringify(data, null, 2),
  );
}

export function csvCell(value: string | number | boolean): string {
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCSV(notes: LocalNote[]): string {
  const header = [
    "id",
    "title",
    "location",
    "body",
    "checklist_done",
    "checklist_total",
    "updated_at",
    "has_photo",
  ];
  const rows = notes.map((n) => [
    n.id,
    n.title,
    n.location,
    n.body,
    n.checklist.filter((c) => c.done).length,
    n.checklist.length,
    new Date(n.updatedAt).toISOString(),
    !!n.photo,
  ]);
  return [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
}

export function exportCSV(notes: LocalNote[]) {
  download(`field-notes-${stamp()}.csv`, "text/csv", toCSV(notes));
}
