# 30 · Offline Field Notes (PWA)

**Roadmap stage:** Phase 8 – Full-Stack · May 2026

**Inspired by:** GetcKo, the offline-first desktop copilot I built for the AppBuildersPH 2026 "Local AI" challenge. The whole point there was that people need help that still works without internet and without sending their private data somewhere else.

This is the student-sized version of that idea: an installable web app for community survey volunteers who walk around barangays with spotty signal. Every note and checklist is saved to the phone first (IndexedDB is the source of truth), and changes wait in an outbox until the device is back online, then sync to a small Express server so other volunteers' devices can pull them.

### Features
- Installable PWA with a small first-party manifest and service worker, fully offline after the first load
- Notes with title, location, free text and a checklist, all stored in **IndexedDB** (`idb`)
- **Outbox queue**: every save is written to the note store and the outbox in one transaction, then pushed when online (on reconnect, every 30 s, or with the sync button)
- Pull with a server cursor (`rev`), so a device only downloads what changed
- **Last-write-wins** using `updatedAt`, with a **Conflicts** view that shows the kept and the replaced version side by side and lets you restore the replaced one
- Online/offline indicator and a "waiting to sync" counter
- Photo attachment stored as a **Blob** in IndexedDB (stays on the device)
- Export to **JSON** or **CSV**
- Unit tests for the merge and outbox logic with **Vitest**

### Tech
