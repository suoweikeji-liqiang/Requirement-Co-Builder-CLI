# Research Summary: Requirement Co-Builder CLI

**Synthesized:** 2026-03-02
**Overall Confidence:** HIGH (stack) / MEDIUM (features/differentiators)

---

## Recommended Stack

| Layer | Choice | Version |
|-------|--------|---------|
| CLI framework | `commander` | ^12 |
| LLM integration | `ai` (Vercel AI SDK) | ^5 |
| LLM providers | `@ai-sdk/openai` + `@ai-sdk/anthropic` | ^1 |
| Interactive prompts | `@inquirer/prompts` | ^7 |
| Structured output | `ai` generateObject + `zod` | ^3 |
| File I/O | `node:fs/promises` (built-in) | — |
| Testing | `vitest` + `@vitest/coverage-v8` | ^2 |
| Build/bundle | `tsup` | ^8 |
| Dev runner | `tsx` | ^4 |

Key constraints: ESM-only (`"type": "module"`), Node 18+ minimum, AI SDK v5 (breaking changes from v4).

---

## Table Stakes Features

Must ship in v1 or the product feels incomplete:

1. **Project creation & management** — `init`, `list`, `open`, `delete` commands; named workspaces with persisted state
2. **Multi-turn dialogue with context persistence** — context survives process restarts; full history + current stage restored
3. **Save / resume sessions** — serialized JSON format; losing progress is a dealbreaker
4. **Clarity stage progression** — `EXPLORING → NARROWING → CONFIRMING → LOCKED`; prevents jumping to solutions before the problem is understood
5. **Structured output** — one-liner (elevator pitch), summary (1-page), full spec document
6. **Export to Markdown** — clean enough to feed directly into Claude Code / Copilot / Cursor
7. **Basic input validation & error recovery** — graceful Ctrl+C, empty input, malformed answers

Defer to v2: logic premise visualization, anti-rhythm-hijacking formalization, controlled knowledge explanation, plugin system, web UI, team collaboration.

---

## Architecture Overview

Seven components with clear boundaries:

| Component | Responsibility |
|-----------|---------------|
| CLI Layer | Entry point; argv parsing, readline REPL, terminal rendering |
| Dialogue Engine | Conversation loop; prompt building, stage transitions, turn history |
| LLM Adapter | Provider abstraction (`OpenAIAdapter` / `AnthropicAdapter`); retries, error normalization |
| Output Parser | Raw LLM string → typed `LLMResponse` sections; regex extraction with Zod validation |
| State Manager | `state.json` schema; immutable updates via `applyUpdate()`; atomic writes |
| File Manager | Project directory layout; `state.json`, `history.json`; project listing |
| Output Compiler | Pure function: `(ProjectState, Turn[]) → { spec, acceptance, tasks }`; no I/O |

Data flow: `User input → CLI → Dialogue Engine → LLM Adapter → Output Parser → State Manager → File Manager → CLI → Terminal`

Build order (dependency-driven): Types → Output Parser → LLM Adapter → State Manager → File Manager → Dialogue Engine → Output Compiler → CLI Layer

---

## Top Pitfalls to Avoid

1. **LLM wraps JSON in markdown fences** — Use provider structured-output APIs as primary constraint; regex-extract first `{...}` block as fallback; validate with Zod; max 2 retries. Address in Phase 1 before anything builds on the parser.

2. **State file corruption on crash** — Write to `state.json.tmp` then `fs.rename()`. On startup, recover from `.tmp` if `state.json` is corrupt. Keep `.bak` copy. Address in Phase 1.

3. **Context rot after turn 15+** — Inject rolling structured summary (`state.json`) at prompt top; cap raw history to last 6–8 turns. Design this before the session loop, not after.

4. **Blocking REPL on LLM response** — Stream all conversational turns (`streamText`); show spinner immediately to cover TTFT gap; handle `SIGINT` during streaming without writing partial state.

5. **Model ignores "one question only" constraint** — Repeat constraint in system prompt AND last line of every user-turn message; defensively take `questions[0]` if array length > 1; re-prompt once if `question` field is missing.

---

## Build Order Recommendation

Synthesized from architecture dependencies, feature dependencies, and pitfall phase warnings:

**Phase 1 — Foundation (unblocks everything)**
- Types/interfaces (`ProjectState`, `LLMResponse`, `Turn`, `ChatRequest`)
- File I/O utilities with `path.join` everywhere, `os.homedir()`, explicit UTF-8
- State Manager with atomic writes (temp file + rename) and `.bak` recovery
- LLM Adapter with streaming, spinner, error mapping, and JSON extraction hardening
- Output Parser with Zod validation and markdown-fence stripping

Rationale: All pitfalls rated "Phase 1" must be solved here. Every other component depends on these being correct.

**Phase 2 — Core Dialogue Loop**
- Dialogue Engine with clarity stage machine (`EXPLORING → NARROWING → CONFIRMING → LOCKED`)
- Context management: rolling summary injection, 6–8 turn raw history cap
- Prompt engineering: one-question constraint, five-dimension tracking
- File Manager: project init, history append, project listing
- CLI Layer: `new` and `resume` commands, readline REPL

Rationale: This is the product. Needs Phase 1 solid before building.

**Phase 3 — Output & Polish**
- Output Compiler: spec.md, acceptance.md, tasks.md generation
- CLI Layer: `build` command, config command (provider/model selection)
- Five-dimension completeness scoring and gap surfacing
- Error messages, help text, README with Windows `chcp 65001` guidance

Rationale: Deliverable layer; pure functions over stable data model from Phase 2.

---

## Open Questions

Consolidated from all research files:

- **Context window budget:** How many raw turns to keep before summarizing? Research suggests 6–8, but optimal number depends on average turn length — needs empirical tuning.
- **Clarity stage transition triggers:** What signals move the stage machine forward? Turn count threshold? LLM-emitted clarity score? User explicit confirmation? Not resolved in research.
- **Provider selection UX:** Config file vs. env vars vs. interactive setup on first run? Needs a decision before CLI Layer is built.
- **Windows atomic rename:** `fs.rename()` across devices fails on Windows — need to handle `EXDEV` error with copy+delete fallback.
- **Five-dimension completeness scoring:** How is the score computed? LLM-evaluated or rule-based? Affects Output Parser and State Manager design.
- **History format:** `history.json` as append-only log vs. array — append-only is safer for large sessions but harder to query; decision affects File Manager API.
