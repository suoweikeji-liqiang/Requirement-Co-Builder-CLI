# Stack Research: Requirement Co-Builder CLI

**Researched:** 2026-03-02
**Overall Confidence:** High

---

## Recommended Stack

### 1. CLI Framework

**Choice:** `commander@12`
**Why:** 500M+ weekly downloads, minimal API surface, zero opinions about project structure. For a tool that is primarily a REPL session (not a multi-subcommand suite), Commander's lightweight argument parsing is all you need. oclif is overkill — it imposes a class-based plugin architecture suited for Heroku-scale CLIs. Yargs is fine but its API is more verbose for simple use cases.
**Avoid:**
- `oclif` — heavy scaffolding, class-based, designed for plugin ecosystems. Adds ~10 deps you won't use.
- `yargs` — verbose chaining API; fine but Commander is simpler for this scope.
- `vorpal` — abandoned, last release 2017.

**Confidence:** High

---

### 2. LLM SDK / Multi-Provider Integration

**Choice:** `ai@5` (Vercel AI SDK) + `@ai-sdk/openai` + `@ai-sdk/anthropic`
**Why:** AI SDK 5.0 is a unified TypeScript-first toolkit supporting 100+ models with a single API. Provider switching is one config line. It ships `generateText`, `streamText`, `generateObject`, and `streamObject` natively — covering both streaming REPL output and structured requirement extraction in one package. The provider packages are thin adapters; no LangChain abstraction tax.
**Avoid:**
- `langchain` — massive dependency tree, heavy abstraction, frequent breaking changes, designed for agent pipelines not simple multi-turn chat.
- Raw `openai` + `@anthropic-ai/sdk` separately — works, but you'd hand-roll the provider-switching logic that AI SDK gives you for free.
- `openai` SDK alone — locks you to one provider.

**Confidence:** High

---

### 3. Interactive Prompt / REPL Interface

**Choice:** `@inquirer/prompts@7` (the modern modular Inquirer rewrite)
**Why:** Inquirer was rewritten from scratch as scoped modular packages. `@inquirer/prompts` is the batteries-included bundle. It handles multi-line input, confirmation, lists — all the prompt types a clarification REPL needs. Promise-based, ESM-native, actively maintained. For the streaming chat loop itself, Node's built-in `readline` (via `node:readline/promises`) is sufficient and adds zero deps.
**Avoid:**
- Legacy `inquirer@8` and below — the old monolith, superseded by the scoped rewrite.
- `prompts` — smaller community, less active maintenance in 2025-2026.
- `enquirer` — good DX but lower activity; Inquirer's rewrite closed the gap.
- `ink` — React-for-terminals is the right tool for dashboard UIs, not for a sequential Q&A REPL. Adds React as a dep for no benefit here.

**Confidence:** High

---

### 4. Structured Output Parsing from LLM

**Choice:** `ai@5` `generateObject` / `streamObject` + `zod@3`
**Why:** AI SDK's `generateObject` takes a Zod schema and returns a validated, typed object — the model is constrained to emit JSON matching the schema. This is the standard pattern for extracting structured requirements from LLM responses. Zod is the de facto TypeScript validation library (used internally by AI SDK itself).
**Avoid:**
- Manual JSON.parse + regex extraction — brittle, breaks on model formatting variation.
- `instructor` (JS port) — useful but redundant when AI SDK already provides `generateObject`.
- `zod-to-json-schema` manually — AI SDK handles schema serialization internally.

**Confidence:** High

---

### 5. File I/O and Project Storage

**Choice:** Node built-ins (`node:fs/promises`, `node:path`) + `zod@3` for schema validation on read
**Why:** JSON project files and Markdown output don't need a database or ORM. `fs/promises` is async, cross-platform, and zero-dep. Validate loaded JSON against a Zod schema on read to catch corruption early. For atomic writes (prevent partial-write corruption), write to a `.tmp` file then `fs.rename`.
**Avoid:**
- `lowdb` — adds abstraction over plain JSON with no benefit at this scale.
- `nedb` / `sqlite` — unnecessary for local single-user project files.
- `fs-extra` — was useful pre-Node 16; `fs/promises` now covers everything it offered.

**Confidence:** High

---

### 6. Testing Framework

**Choice:** `vitest@2`
**Why:** Native ESM support, native TypeScript support (no `ts-jest` config), 10-20x faster than Jest in watch mode, compatible Jest API so migration is trivial. For a pure Node.js CLI with no Vite frontend, Vitest still wins on ESM + TypeScript ergonomics. Built-in coverage via `@vitest/coverage-v8`.
**Avoid:**
- `jest` — requires `ts-jest` or Babel transform for TypeScript, ESM support is still awkward in 2025-2026.
- `mocha` + `chai` — more setup, no built-in TypeScript support, no built-in coverage.

**Confidence:** High

---

### 7. Build and Distribution

**Choice:** `tsup@8` for bundling + `tsx@4` for local dev execution
**Why:** `tsup` (esbuild-powered) produces a single CJS+ESM dual bundle with a shebang for the CLI binary in one zero-config command. `tsx` lets you run TypeScript directly during development without a build step (`tsx src/index.ts`). Together they cover the full dev→dist workflow. For npm distribution, `tsup` output + `package.json` `bin` field is the standard pattern.
**Avoid:**
- `tsc` alone — no bundling, outputs many files, requires manual shebang injection.
- `pkgroll` — good alternative but `tsup` has larger community and more CLI-specific examples.
- `webpack` / `rollup` directly — config overhead with no benefit over tsup for a CLI.
- `ncc` (Vercel) — single-file bundler, less actively maintained than tsup.

**Confidence:** High

---

## Stack Summary Table

| Layer | Choice | Version | Confidence |
|-------|--------|---------|------------|
| CLI framework | `commander` | ^12 | High |
| LLM integration | `ai` (Vercel AI SDK) | ^5 | High |
| OpenAI provider | `@ai-sdk/openai` | ^1 | High |
| Anthropic provider | `@ai-sdk/anthropic` | ^1 | High |
| Interactive prompts | `@inquirer/prompts` | ^7 | High |
| Structured output | `ai` generateObject + `zod` | ^3 | High |
| File I/O | `node:fs/promises` (built-in) | — | High |
| Schema validation | `zod` | ^3 | High |
| Testing | `vitest` | ^2 | High |
| Test coverage | `@vitest/coverage-v8` | ^2 | High |
| Build/bundle | `tsup` | ^8 | High |
| Dev runner | `tsx` | ^4 | High |

---

## Notes

- All packages are ESM-compatible. Set `"type": "module"` in `package.json` and target `"node18"` minimum (LTS as of 2026).
- AI SDK 5.0 introduced breaking changes from v4 — use v5 docs, not v4 examples found in older blog posts.
- `zod` v3 is stable; v4 is in progress but not yet production-recommended as of early 2026.
- For cross-platform path handling, always use `node:path` — never string concatenation.
- Streaming (`streamText`) is preferred over `generateText` for the REPL loop so users see output incrementally rather than waiting for full completion.
