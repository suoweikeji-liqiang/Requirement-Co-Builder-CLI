# Phase 1: Foundation - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the infrastructure layer: TypeScript/Node.js project scaffold, LLM adapter (OpenAI + Anthropic), streaming terminal display, atomic state/file I/O, and cross-platform path/encoding support. This phase delivers no user-visible dialogue features — it is the foundation all other phases depend on.

Requirements in scope: INFR-01, INFR-02, INFR-03, INFR-04, INFR-05, INFR-06, PROJ-07.

</domain>

<decisions>
## Implementation Decisions

### Language & Runtime
- TypeScript + Node.js (not Python, not Go, not Bun)
- Single package structure (monolith) — one tsconfig.json, one src/ tree, one package.json
- Build toolchain: tsc (TypeScript compiler) — tsx/ts-node for dev, tsc output to dist/ for prod
- Distribution: npm (global install via `npm install -g` or `npx`) — no standalone binary needed

### LLM Configuration
- API keys stored in config file: `~/.reqgen/config.json` via `req config set-key <provider> <key>`
- Provider selection: saved default (`req config set-provider openai`) — no flag needed per command
- Model selection: Claude picks sensible defaults per provider (e.g. gpt-4o for OpenAI, claude-sonnet for Anthropic); user can override in config
- Missing key behavior: clear error with fix instruction — "No API key set. Run: req config set-key openai <key>"

### Streaming Display
- Tokens stream to terminal in real-time as the model generates (not spinner-then-dump)
- Show a streaming indicator (e.g. dim prefix or `│` gutter) while tokens are arriving so user knows it's still generating
- Layout: stream inline, draw a separator line when response completes
- Interruption handling: show clear error message + offer to retry the last round; do not lose partial response

### State Storage Format
- One directory per project under `~/.reqgen/projects/<project-id>/`
- Directory contains: `state.json` (machine data), `idea.md`, `decisions.md` (human-readable)
- `--local` flag stores project in current working directory instead (PROJ-07)
- Project IDs: short hash + idea slug (e.g. `a3f2-build-a-cli-tool`) — human-readable, collision-resistant
- Crash-safe writes: write to `state.json.tmp` first, then atomic rename to `state.json`; on load, recover from `.tmp` if `state.json` is missing/corrupt (INFR-04)
- Dialogue history stored as full message objects with metadata (role, content, timestamp) — enables future search and reconstruction

### Claude's Discretion
- Exact spinner/indicator library choice (ora, cli-spinners, etc.)
- Exact separator line style and formatting
- Internal module structure within src/
- Zod schema design for structured output validation (INFR-03)
- Exact error message copy beyond the key patterns above
- Chinese character encoding fix approach for Windows (INFR-05, INFR-06)

</decisions>

<specifics>
## Specific Ideas

- The config file pattern should feel familiar — like `~/.npmrc` or `~/.gitconfig` in spirit
- Streaming should feel like modern AI tools (Claude.ai, ChatGPT) — tokens appearing in real time
- Project IDs must be typeable: a short hash prefix + readable slug, not a raw UUID

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — this is a greenfield project with no existing source code

### Established Patterns
- None yet — this phase establishes the patterns all other phases will follow

### Integration Points
- `src/adapters/llm.ts` — LLM adapter interface; Phase 2 dialogue engine will import this
- `src/state/` — State read/write functions; Phase 2 project management commands will import these
- `src/config.ts` — Config load/save; all commands will import this
- `bin/req.ts` — CLI entry point; Phase 2 adds commands here

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-02*
