# Project State

## Project Reference
See: .planning/PROJECT.md (updated 2026-03-02)
**Core value:** 通过结构化对话让模糊想法逐轮收敛为可执行的需求描述，同时保持人对思考过程的主导权。
**Current focus:** Not started

## Progress

| Phase | Status | Progress |
|-------|--------|----------|
| 1. Foundation | ○ Pending | 0% |
| 2. Core Dialogue | ○ Pending | 0% |
| 3. Output & Polish | ○ Pending | 0% |

## Current Phase
None — project initialized, not yet started.

## Accumulated Context

### Key Decisions
- Node.js / TypeScript, ESM-only, Node 18+
- Vercel AI SDK v5 for LLM integration (OpenAI + Anthropic adapters)
- Atomic writes: temp + rename; `.bak` recovery on corrupt state
- Storage: `~/.reqgen/projects/` global or `--local` current directory
- Dialogue language Chinese; structured output fields English

### Open Questions
- Context window budget: how many raw turns before rolling summary? (research suggests 6–8)
- Clarity stage transition triggers: turn count, LLM score, or explicit user confirmation?
- Provider selection UX: config file vs. env vars vs. interactive first-run setup?
- Windows atomic rename: handle `EXDEV` with copy+delete fallback

### Blockers
None.

---
*Last updated: 2026-03-02 after initialization*
