# 30 · Offline Field Notes (PWA)

**Roadmap stage:** Phase 8 – Full-Stack · May 2026

**Inspired by:** GetcKo, the offline-first desktop copilot I built for the AppBuildersPH 2026 "Local AI" challenge. The whole point there was that people need help that still works without internet and without sending their private data somewhere else.

This is the student-sized version of that idea: an installable web app for community survey volunteers who walk around barangays with spotty signal. Every note and checklist is saved to the phone first (IndexedDB is the source of truth), and changes wait in an outbox until the device is back online, then sync to a small Express server so other volunteers' devices can pull them.
