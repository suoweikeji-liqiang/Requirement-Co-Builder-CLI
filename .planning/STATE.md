# Project State

## Project Reference
See: .planning/PROJECT.md (updated 2026-03-02)
**Core value:** 通过结构化对话让模糊想法逐轮收敛为可执行的需求描述，同时保持人对思考过程的主导权。
**Current focus:** Phase 1 - Foundation (Plan 01 complete)

## Progress

| Phase | Status | Progress |
|-------|--------|----------|
| 1. Foundation | ◔ In Progress | 33% (1/3 plans) |
| 2. Core Dialogue | ○ Pending | 0% |
| 3. Output & Polish | ○ Pending | 0% |

## Current Phase
Phase 1: Foundation — Plan 01 complete. Next: Plan 02 (atomic state layer).

## Accumulated Context

### Key Decisions
- Node.js / TypeScript, ESM-only, Node 18+
- Vercel AI SDK v5 for LLM integration (OpenAI + Anthropic adapters)
- Atomic writes: temp + rename; `.bak` recovery on corrupt state
- Storage: `~/.reqgen/projects/` global or `--local` current directory
- Dialogue language Chinese; structured output fields English
- Config always global (~/.reqgen/config.json) even with --local flag; only project storage is local
- EXDEV fallback: copyFile + unlink for Windows cross-device rename compatibility
- ESM-only output (no CJS shim) - tsup format:esm, tsconfig module:NodeNext
- All local imports use .js extension (NodeNext ESM requirement)

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

---
*Last session: 2026-03-02T05:47:34Z — Stopped at: Completed 01-foundation/01-01-PLAN.md*
