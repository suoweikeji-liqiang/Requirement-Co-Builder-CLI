# Phase 1: Foundation - Research

**Researched:** 2026-03-02
**Domain:** TypeScript/Node.js CLI infrastructure, LLM adapters, streaming terminal output, atomic file I/O, cross-platform encoding
**Confidence:** HIGH (core stack verified via official sources; encoding pitfalls verified via GitHub issues)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Language & Runtime
- TypeScript + Node.js (not Python, not Go, not Bun)
- Single package structure (monolith) — one tsconfig.json, one src/ tree, one package.json
- Build toolchain: tsc (TypeScript compiler) — tsx/ts-node for dev, tsc output to dist/ for prod
- Distribution: npm (global install via `npm install -g` or `npx`) — no standalone binary needed

#### LLM Configuration
- API keys stored in config file: `~/.reqgen/config.json` via `req config set-key <provider> <key>`
- Provider selection: saved default (`req config set-provider openai`) — no flag needed per command
- Model selection: Claude picks sensible defaults per provider (e.g. gpt-4o for OpenAI, claude-sonnet for Anthropic); user can override in config
- Missing key behavior: clear error with fix instruction — "No API key set. Run: req config set-key openai <key>"

#### Streaming Display
- Tokens stream to terminal in real-time as the model generates (not spinner-then-dump)
- Show a streaming indicator (e.g. dim prefix or `│` gutter) while tokens are arriving so user knows it's still generating
- Layout: stream inline, draw a separator line when response completes
- Interruption handling: show clear error message + offer to retry the last round; do not lose partial response

#### State Storage Format
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

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFR-01 | Multi-provider LLM support (OpenAI, Anthropic) via configurable adapter | AI SDK 6 `@ai-sdk/openai` + `@ai-sdk/anthropic` provide unified interface; adapter pattern in `src/adapters/llm.ts` |
| INFR-02 | Streaming LLM responses for responsive UX | AI SDK 6 `streamText` + `result.textStream` async iterable; `process.stdout.write` per delta |
| INFR-03 | Structured output parsing with fallback/retry on malformed responses | `generateText` with `Output.object({ schema })` + Zod v4; `jsonrepair` for fenced-block fallback; manual retry loop |
| INFR-04 | Atomic file writes (temp + rename) for crash safety | Write to `state.json.tmp` in same dir; `fs.promises.rename`; EXDEV catch with `copyFile+unlink` fallback |
| INFR-05 | Cross-platform support (Windows/macOS/Linux) with correct path and encoding handling | `os.homedir()` + `path.join`; `process.stdout.write` with UTF-8 strings; Windows Terminal handles modern Node.js fine |
| INFR-06 | Dialogue language Chinese, structured output fields English | Node.js strings are UTF-16 internally; `process.stdout.write` handles Chinese correctly in modern Node.js 18+ on Windows Terminal |
| PROJ-07 | User can configure storage location (global `~/.reqgen/` or `--local` current directory) | CLI flag `--local` via Commander; `process.cwd()` vs `os.homedir()` for base path resolution |
</phase_requirements>

---

## Summary

Phase 1 builds the infrastructure all other phases depend on. The stack is TypeScript + Node.js ESM with Vercel AI SDK 6 (the current stable release as of 2026, superseding v5). The SDK provides a unified `streamText` / `generateText` API over OpenAI and Anthropic with zero provider-specific branching in application code. Commander.js handles CLI argument parsing, and `ora` provides the streaming indicator. Zod v4 (released May 2025) validates structured LLM output.

Atomic file I/O on Windows requires writing the temp file to the **same directory** as the destination to avoid cross-device `EXDEV` errors on rename. The `write-file-atomic` npm package handles this pattern correctly, but its current engine constraint (`^20.17.0 || >=22.9.0`) means the project needs Node 20.17+ or 22+. Custom implementation using `fs.promises.writeFile` + `fs.promises.rename` with an EXDEV catch-and-copy fallback is equally valid and avoids the dependency.

Chinese character output on modern Windows (Windows Terminal + Node.js 18+) works correctly with `process.stdout.write` as long as the terminal is set to UTF-8 (Windows Terminal does this by default since 2019). The app does not need to call `chcp 65001` — but should document the requirement for users still on legacy cmd.exe.

**Primary recommendation:** Use Vercel AI SDK 6 (`ai` + `@ai-sdk/openai` + `@ai-sdk/anthropic`), Commander.js, Zod v4, `ora` v9, and a manual atomic write implementation. Keep the LLM adapter behind a thin interface so Phase 2 can extend it without touching infrastructure.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `ai` (Vercel AI SDK) | 6.x (6.0.105+ current) | Unified LLM streaming + structured output | Single API for 20+ providers; textStream async iterable; active maintenance |
| `@ai-sdk/openai` | latest (matches `ai`) | OpenAI provider adapter | Official Vercel provider; covers GPT-4o |
| `@ai-sdk/anthropic` | latest (matches `ai`) | Anthropic provider adapter | Official Vercel provider; covers claude-sonnet |
| `commander` | ^13 | CLI argument parsing + subcommands | Most widely used Node.js CLI framework; excellent TypeScript support |
| `zod` | ^4.x | Schema validation for LLM structured output | TypeScript-first; v4 has native JSON Schema interop; ecosystem standard |
| `ora` | ^9.0.0 | Terminal spinner for streaming indicator | ESM-only v9; single-spinner per operation; TTY-aware |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `jsonrepair` | ^3.x | Repair fenced/malformed JSON from LLM | Fallback when `generateText` with structured output fails; strip ```json blocks |
| `tsx` | ^4.x | Run TypeScript directly in dev | Dev entrypoint; no compile step during development |
| `chalk` | ^5.x | Terminal colors/styling (ESM) | Separator lines, error messages, streaming gutter indicator |
| `tsup` | ^8.x | Build TypeScript to dist/ | Production build; handles ESM output and bin shebang |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `ora` | `@clack/prompts` spinner | `@clack/prompts` is richer for interactive wizard flows but overkill for Phase 1; spinner-only use fits `ora` better |
| `commander` | `yargs` | Yargs has better TypeScript inference for parsed args but is larger; Commander is sufficient for this CLI's command surface |
| `write-file-atomic` | Manual temp+rename | `write-file-atomic` requires Node `^20.17.0 || >=22.9.0`; manual implementation gives full control and no engine constraint |
| AI SDK `generateText` with `Output.object` | `generateObject` (v4 API) | AI SDK v6 replaced standalone `generateObject` with `generateText` + `Output.object()` — use the v6 API |

**Installation:**
```bash
npm install ai @ai-sdk/openai @ai-sdk/anthropic commander zod ora chalk jsonrepair
npm install -D typescript @types/node tsx tsup
```

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── bin/
│   └── req.ts            # CLI entry point — shebang, Commander setup, command registration
├── adapters/
│   └── llm.ts            # LLM adapter interface + factory; Phase 2 imports this
├── config/
│   ├── index.ts          # Load/save ~/.reqgen/config.json
│   └── schema.ts         # Zod schema for config file structure
├── state/
│   ├── index.ts          # Read/write project state; exported functions Phase 2 uses
│   ├── schema.ts         # Zod schema for state.json structure
│   └── atomic.ts         # Atomic write implementation (temp + rename + EXDEV fallback)
├── display/
│   ├── stream.ts         # Streaming token renderer (gutter indicator + separator)
│   └── errors.ts         # User-facing error formatting
└── utils/
    ├── paths.ts          # Cross-platform path helpers (homedir, project dirs, --local)
    ├── encoding.ts       # stdout UTF-8 detection/fix for Windows
    └── id.ts             # Project ID generation (short hash + slug)

dist/                     # tsc output (gitignored)
bin/
  req                     # Symlink or wrapper (set in package.json "bin")
```

### Pattern 1: LLM Adapter Interface

**What:** Define a narrow TypeScript interface for LLM calls; factory function returns the right provider implementation.
**When to use:** Always — keeps Phase 2 dialogue engine decoupled from provider specifics.

```typescript
// src/adapters/llm.ts
// Source: AI SDK docs https://ai-sdk.dev/docs/getting-started/nodejs

import { streamText, generateText, Output } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import type { LanguageModel } from 'ai';
import type { ZodSchema } from 'zod';

export type Provider = 'openai' | 'anthropic';

export interface LLMAdapter {
  streamText(messages: Message[], onToken: (token: string) => void): Promise<void>;
  generateStructured<T>(messages: Message[], schema: ZodSchema<T>): Promise<T>;
}

export function createModel(provider: Provider, modelId: string): LanguageModel {
  if (provider === 'openai') return openai(modelId);
  if (provider === 'anthropic') return anthropic(modelId);
  throw new Error(`Unknown provider: ${provider}`);
}
```

### Pattern 2: Token Streaming to Terminal

**What:** Use AI SDK `streamText` result as async iterable; write tokens directly to stdout; show gutter indicator.
**When to use:** All LLM interactions in dialogue engine.

```typescript
// src/display/stream.ts
// Source: AI SDK docs https://ai-sdk.dev/docs/getting-started/nodejs

import { streamText } from 'ai';
import type { LanguageModel } from 'ai';
import type { CoreMessage } from 'ai';
import chalk from 'chalk';

export async function streamResponse(model: LanguageModel, messages: CoreMessage[]): Promise<string> {
  const result = streamText({ model, messages });

  process.stdout.write(chalk.dim('│ '));  // streaming gutter
  let fullText = '';

  for await (const delta of result.textStream) {
    process.stdout.write(delta);
    fullText += delta;
  }

  process.stdout.write('\n' + chalk.dim('─'.repeat(60)) + '\n');
  return fullText;
}
```

### Pattern 3: Atomic State Write

**What:** Write to `state.json.tmp` in the same directory, then rename. Catch EXDEV on Windows (cross-device move) and fall back to copy+delete.
**When to use:** Every state mutation.

```typescript
// src/state/atomic.ts
// Source: Node.js fs.promises docs + EXDEV pattern from GitHub issues

import { promises as fs } from 'node:fs';
import path from 'node:path';

export async function atomicWrite(filePath: string, data: string): Promise<void> {
  const tmpPath = filePath + '.tmp';
  await fs.writeFile(tmpPath, data, 'utf8');
  try {
    await fs.rename(tmpPath, filePath);
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'EXDEV') {
      // Windows: temp and dest on different drives — copy then delete
      await fs.copyFile(tmpPath, filePath);
      await fs.unlink(tmpPath);
    } else {
      throw err;
    }
  }
}

export async function readStateWithRecovery(filePath: string): Promise<string | null> {
  const tmpPath = filePath + '.tmp';
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    // state.json missing or corrupt — try .tmp recovery
    try {
      const recovered = await fs.readFile(tmpPath, 'utf8');
      // promote .tmp to main
      await fs.rename(tmpPath, filePath);
      return recovered;
    } catch {
      return null;
    }
  }
}
```

### Pattern 4: Structured Output with Zod + Fallback

**What:** Use `generateText` with `Output.object()` for structured LLM output; on failure, attempt `jsonrepair` on raw text + manual Zod parse.
**When to use:** Any LLM call that must return structured data.

```typescript
// src/adapters/llm.ts (structured variant)
// Source: AI SDK docs + jsonrepair npm

import { generateText, Output } from 'ai';
import { jsonrepair } from 'jsonrepair';
import type { LanguageModel } from 'ai';
import type { z } from 'zod';

export async function generateStructured<T>(
  model: LanguageModel,
  messages: CoreMessage[],
  schema: z.ZodSchema<T>,
): Promise<T> {
  try {
    const { output } = await generateText({
      model,
      messages,
      output: Output.object({ schema }),
    });
    return output as T;
  } catch {
    // Fallback: get raw text, repair JSON, validate with Zod
    const { text } = await generateText({ model, messages });
    const repaired = jsonrepair(text);
    return schema.parse(JSON.parse(repaired));
  }
}
```

### Pattern 5: Cross-Platform Path Resolution

**What:** Use Node.js built-in `os.homedir()` and `path.join` for all paths; resolve `--local` flag to `process.cwd()`.
**When to use:** All file path construction.

```typescript
// src/utils/paths.ts
import os from 'node:os';
import path from 'node:path';

const GLOBAL_BASE = path.join(os.homedir(), '.reqgen');

export function getBaseDir(useLocal: boolean): string {
  return useLocal ? process.cwd() : GLOBAL_BASE;
}

export function getProjectDir(projectId: string, useLocal: boolean): string {
  return path.join(getBaseDir(useLocal), 'projects', projectId);
}

export function getConfigPath(): string {
  return path.join(GLOBAL_BASE, 'config.json');
}
```

### Anti-Patterns to Avoid

- **`__dirname` in ESM:** ESM does not have `__dirname`. Use `import.meta.dirname` (Node 21.2+) or `new URL('.', import.meta.url).pathname` for older Node 18/20.
- **Concatenating path strings:** Always use `path.join()` — Windows uses backslash separators and string concatenation breaks cross-platform.
- **`JSON.stringify` + `fs.writeFile` without atomic:** A crash mid-write corrupts `state.json` permanently. Always use the temp+rename pattern.
- **Calling `chcp 65001` from Node.js subprocess:** Does not reliably fix encoding and creates Windows-specific code paths. Use `process.stdout.write` with UTF-8 strings directly — modern Windows Terminal handles this.
- **Spinner running during `for await` token loop:** `ora` and `for await` on `textStream` conflict — stop/hide the spinner before streaming starts, or do not use a spinner during streaming (use the gutter indicator pattern instead).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Streaming LLM calls across providers | Custom fetch wrappers per provider | `ai` + `@ai-sdk/openai` + `@ai-sdk/anthropic` | Provider auth, retry, SSE parsing, error codes differ per provider; SDK normalizes all of it |
| Schema validation of LLM output | Custom JSON parser + type guards | `zod` v4 | Type inference, error messages, nested validation, safeParse — hand-rolled equivalents miss edge cases |
| Fenced code block stripping + JSON repair | Regex heuristics | `jsonrepair` | LLMs produce surprising malformations (trailing commas, single quotes, incomplete JSON, mixed text+JSON) that simple regex misses |
| Terminal spinner | `process.stdout.write` animation loop | `ora` v9 | TTY detection, cursor hide/show, SIGINT cleanup, CI detection — all handled |
| Terminal colors | ANSI escape string literals | `chalk` v5 | Level detection (no-color, CI, Windows), color stripping for non-TTY, correct reset codes |

**Key insight:** Each of these "simple" problems has 3–7 edge cases that only surface in production (CI environments, Windows cmd, non-TTY piping, partial JSON from token limits). Use libraries that have already solved them.

---

## Common Pitfalls

### Pitfall 1: EXDEV on Windows Atomic Rename

**What goes wrong:** `fs.rename(tmpPath, destPath)` throws `EXDEV: cross-device link not permitted` on Windows when `%TEMP%` is on a different drive than the destination.
**Why it happens:** `TEMP` defaults to `C:\Users\...\AppData\Local\Temp` but can be overridden to a different drive (e.g., `D:\Temp`). OS rename syscall cannot cross drive boundaries.
**How to avoid:** Write the temp file to the **same directory** as the destination (`filePath + '.tmp'`), not to `os.tmpdir()`. Catch `EXDEV` anyway and fall back to `copyFile + unlink`.
**Warning signs:** Works on dev machine (single drive) but fails in some user environments.

### Pitfall 2: ESM `__dirname` Does Not Exist

**What goes wrong:** `__dirname` is undefined in ESM modules, causing `ReferenceError` at runtime.
**Why it happens:** `"type": "module"` in `package.json` activates ESM mode; `__dirname`/`__filename` are CommonJS globals.
**How to avoid:** Use `import.meta.dirname` on Node 21.2+ or this polyfill for Node 18/20:
```typescript
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```
**Warning signs:** `ReferenceError: __dirname is not defined in ES module scope`.

### Pitfall 3: Spinner + Streaming Token Loop Conflict

**What goes wrong:** Starting `ora` spinner then entering `for await (const delta of result.textStream)` — the spinner's interval timer and the stdout write calls interleave, producing garbled output.
**Why it happens:** `ora` uses `setInterval` to animate the spinner on the same `stdout` stream that token writes land on.
**How to avoid:** Do not run the spinner during token streaming. Instead: (1) show spinner while waiting for first token, (2) call `spinner.stop()` when first token arrives, (3) then stream tokens with gutter indicator. Or skip the spinner entirely and use the gutter-only approach for streaming.
**Warning signs:** Broken/overwritten lines in terminal during streaming.

### Pitfall 4: Zod v4 + AI SDK Compatibility

**What goes wrong:** AI SDK v5 supported Zod v3; some Zod v4 recursive schemas with `.default()` break `Output.object()` in certain AI SDK versions.
**Why it happens:** Zod v4 changed internal JSON Schema generation; AI SDK conversion layer needs to match.
**How to avoid:** Use `zod@^4.x` with latest `ai@6.x` (they are aligned). Avoid complex recursive schemas in Phase 1 — Phase 1 schemas (config, state) are flat objects. Test structured output schemas against the actual LLM before building the retry layer.
**Warning signs:** `InvalidSchemaError` or immediate failure in `generateText` with `Output.object`.

### Pitfall 5: Chinese Characters Garbled in Legacy Windows cmd.exe

**What goes wrong:** `process.stdout.write('中文')` produces mojibake in Windows cmd.exe with legacy code page (CP936 or CP437).
**Why it happens:** Legacy cmd.exe defaults to system OEM code page, not UTF-8. Node.js writes UTF-8 bytes; cmd.exe misinterprets them.
**How to avoid:** Target Windows Terminal (default UTF-8 since 2019). Document in README: "Use Windows Terminal or PowerShell 7+ for correct Chinese character display." For programmatic fix, call `process.stdout.write('\u{FEFF}')` (BOM) is NOT the fix — instead use `chcp 65001` detection or instruct users.
**Warning signs:** Chinese text appears as `???` or garbled sequences on Windows. Works fine in Windows Terminal and macOS/Linux.

### Pitfall 6: Provider API Key in Environment vs Config File

**What goes wrong:** `@ai-sdk/openai` automatically reads `OPENAI_API_KEY` from `process.env`. If user has the env var set globally but the config file says "use anthropic", the wrong provider may activate silently.
**Why it happens:** AI SDK provider constructors pick up env vars automatically if no explicit API key is passed.
**How to avoid:** Always pass the API key explicitly from the config file to the provider constructor — do not rely on env var auto-detection:
```typescript
import { createOpenAI } from '@ai-sdk/openai';
const openai = createOpenAI({ apiKey: config.apiKey }); // explicit
```
**Warning signs:** Works on machines with OPENAI_API_KEY set, fails on clean machines.

---

## Code Examples

### AI SDK 6: Stream Tokens to stdout

```typescript
// Source: https://ai-sdk.dev/docs/getting-started/nodejs
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { createOpenAI } from '@ai-sdk/openai';

const provider = createOpenAI({ apiKey: 'sk-...' });
const model = provider('gpt-4o');

const result = streamText({
  model,
  messages: [{ role: 'user', content: 'Hello' }],
});

for await (const delta of result.textStream) {
  process.stdout.write(delta);
}
```

### AI SDK 6: Structured Output with Zod

```typescript
// Source: https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data
import { generateText, Output } from 'ai';
import { z } from 'zod';

const schema = z.object({
  understanding: z.string(),
  question: z.string(),
  stage: z.enum(['concept', 'direction', 'structure', 'executable']),
});

const { output } = await generateText({
  model,
  messages,
  output: Output.object({ schema }),
});
// output is typed as { understanding: string; question: string; stage: ... }
```

### Commander.js: ESM CLI Entry Point

```typescript
// Source: https://blog.logrocket.com/building-typescript-cli-node-js-commander/
#!/usr/bin/env node
import { Command } from 'commander';

const program = new Command();
program
  .name('req')
  .description('Requirement Co-Builder CLI')
  .version('0.1.0');

program
  .command('config')
  .description('Manage configuration')
  .addCommand(
    new Command('set-key')
      .argument('<provider>', 'Provider: openai | anthropic')
      .argument('<key>', 'API key')
      .action(async (provider, key) => { /* ... */ })
  );

await program.parseAsync(process.argv);
```

### Zod Config Schema

```typescript
// Source: https://zod.dev/basics
import { z } from 'zod';

export const ConfigSchema = z.object({
  defaultProvider: z.enum(['openai', 'anthropic']).default('openai'),
  defaultModel: z.string().optional(),
  openaiKey: z.string().optional(),
  anthropicKey: z.string().optional(),
});

export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(raw: unknown): Config {
  const result = ConfigSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`Invalid config: ${result.error.message}`);
  }
  return result.data;
}
```

### Project ID Generation

```typescript
// Source: custom pattern per CONTEXT.md decision
import crypto from 'node:crypto';

export function generateProjectId(idea: string): string {
  const hash = crypto.createHash('sha256')
    .update(idea + Date.now())
    .digest('hex')
    .slice(0, 4);  // e.g., "a3f2"

  const slug = idea
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')  // strip special chars
    .trim()
    .split(/\s+/)
    .slice(0, 5)   // max 5 words
    .join('-');     // e.g., "build-a-cli-tool"

  return `${hash}-${slug}`;  // e.g., "a3f2-build-a-cli-tool"
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `generateObject` (AI SDK v3/v4) | `generateText` + `Output.object({ schema })` (AI SDK v6) | July 2025 (v5) → Jan 2026 (v6) | Must use new API; old `generateObject` import no longer exported in v6 |
| CommonJS `require` + `__dirname` | ESM `import` + `import.meta.dirname` | Node.js 18+ (stable 2022) | Project uses `"type": "module"` — all CommonJS patterns break |
| `ts-node` for TypeScript dev execution | `tsx` (esbuild-based) or Node.js `--experimental-strip-types` | 2023–2024 | `tsx` is faster and ESM-native; `ts-node` has ESM compatibility issues |
| `spinner.start()` → wait → `spinner.stop()` display | Streaming tokens in real-time with gutter indicator | User decision (CONTEXT.md) | Fundamentally different UX — implement streaming-first, not spinner-first |

**Deprecated/outdated:**
- `generateObject` as a standalone function: Removed/changed in AI SDK v6 — use `generateText` with `Output.object()`.
- `ts-node` for ESM TypeScript: Works but fragile; `tsx` is the 2025 standard.
- `chcp 65001` subprocess call: Fragile and session-scoped only; target modern terminals instead.

---

## Open Questions

1. **`import.meta.dirname` availability on Node 18/20**
   - What we know: `import.meta.dirname` requires Node 21.2+; Node 18 LTS and 20 LTS do not have it.
   - What's unclear: Project targets Node 18+ — need to decide polyfill vs. raise minimum to Node 20/22.
   - Recommendation: Use `fileURLToPath(import.meta.url)` + `path.dirname` polyfill in `src/utils/paths.ts`; document Node 18+ as minimum. `write-file-atomic` requires Node `^20.17.0 || >=22.9.0` so if used, raises minimum to Node 20.17.

2. **AI SDK `Output.object` vs `generateObject` API in v6**
   - What we know: Documentation shows `generateText` + `Output.object({ schema })`; standalone `generateObject` is not documented in v6.
   - What's unclear: Whether `generateObject` still exists as an alias or is fully removed.
   - Recommendation: Use `generateText` + `Output.object()` as the primary API; this matches current official docs.

3. **Windows Terminal UTF-8 guarantee**
   - What we know: Windows Terminal defaults to UTF-8 since 2019; legacy cmd.exe does not. Node.js `process.stdout.write` with UTF-8 strings works in Windows Terminal.
   - What's unclear: Whether to add a runtime check for the code page or simply document the requirement.
   - Recommendation: Add a startup check via `process.env.TERM_PROGRAM` or `process.platform === 'win32'` and warn the user if running in a non-UTF-8 terminal. Do not attempt to fix encoding programmatically.

---

## Sources

### Primary (HIGH confidence)
- `https://ai-sdk.dev/docs/getting-started/nodejs` — streamText usage, textStream async iterable pattern, provider packages
- `https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data` — Output.object API with Zod schemas
- `https://vercel.com/blog/ai-sdk-6` — AI SDK 6 release notes confirming v6 is current
- `https://zod.dev/basics` — Zod v4 safeParse, schema API
- `https://github.com/sindresorhus/ora` — ora v9 API, ESM requirement, TTY detection
- `https://github.com/npm/write-file-atomic` — atomic write pattern, EXDEV handling

### Secondary (MEDIUM confidence)
- `https://github.com/anthropics/claude-code/issues/25476` — EXDEV error on Windows confirmed in real production (Claude Code codebase)
- `https://github.com/josdejong/jsonrepair` — jsonrepair npm, fenced block handling
- `https://blog.logrocket.com/building-typescript-cli-node-js-commander/` — Commander.js ESM CLI setup pattern

### Tertiary (LOW confidence)
- WebSearch results on Windows Chinese character encoding — multiple sources agree on `process.stdout.write` working in Windows Terminal; legacy cmd.exe issues confirmed by GitHub issues but not by a single authoritative Node.js doc

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — AI SDK 6 current version confirmed via npm and Vercel blog; Commander, Zod, ora versions confirmed via npm
- Architecture: HIGH — patterns derived from official AI SDK docs and established Node.js CLI patterns
- Pitfalls: HIGH — EXDEV confirmed via real production issue (Claude Code); spinner+streaming conflict verified by ora documentation; ESM `__dirname` is a well-documented Node.js fact

**Research date:** 2026-03-02
**Valid until:** 2026-04-02 (AI SDK moves fast; re-check before planning if >30 days)
