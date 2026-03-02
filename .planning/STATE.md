# Project State

## Project Reference
See: .planning/PROJECT.md (updated 2026-03-02)
**Core value:** 通过结构化对话让模糊想法逐轮收敛为可执行的需求描述，同时保持人对思考过程的主导权。
**Current focus:** Phase 1 - Foundation (Plan 02 complete)

## Progress

| Phase | Status | Progress |
|-------|--------|----------|
| 1. Foundation | ◔ In Progress | 67% (2/3 plans) |
| 2. Core Dialogue | ○ Pending | 0% |
| 3. Output & Polish | ○ Pending | 0% |

## Current Phase
Phase 1: Foundation — Plans 01-02 complete. Next: Plan 03 (LLM adapter + streaming display).

## Accumulated Context

### Key Decisions
- Node.js / TypeScript, ESM-only, Node 18+
- Vercel AI SDK v5 for LLM integration (OpenAI + Anthropic adapters)
- Atomic writes: temp + rename; `.bak` recovery on corrupt state
- Storage: `~/.reqgen/projects/` global or `--local` current directory
- Dialogue language Chinese; structured output fields English
- TDD applied to all Plan 02 tasks: failing tests written first, implementation follows
- Jest uses --experimental-vm-modules + node_modules/jest/bin/jest.js for Windows + chalk ESM compat
- Zod v3 (not v4) installed — flat schemas compatible; no migration needed for Phase 1
- generateProjectId fallback slug 'project' for non-ASCII (Chinese) ideas
- writeProjectState immutable: spread creates new object, original never mutated
- readProjectState returns null on Zod validation failure (treat corrupt as missing)

### Open Questions
- Context window budget: how many raw turns before rolling summary? (research suggests 6–8)
- Clarity stage transition triggers: turn count, LLM score, or explicit user confirmation?
- Provider selection UX: config file vs. env vars vs. interactive first-run setup?
- Windows atomic rename: handled via EXDEV fallback in saveConfig (resolved)

### Blockers
None.

### Performance Metrics

| Phase | Plan | Duration | Tasks | Files |
|-------|------|----------|-------|-------|
| 01-foundation | 01 | 11min | 2 | 8 |
| 01-foundation | 02 | 28min | 2 | 11 |

---
*Last session: 2026-03-02T09:25:00Z — Stopped at: Completed 01-foundation/01-02-PLAN.md*
