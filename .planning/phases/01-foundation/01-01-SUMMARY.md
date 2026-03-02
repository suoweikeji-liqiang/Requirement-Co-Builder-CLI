---
phase: 01-foundation
plan: 01
subsystem: infra
tags: [typescript, nodejs, esm, commander, zod, tsup, tsx]

# Dependency graph
requires: []
provides:
  - ESM TypeScript project scaffold with package.json, tsconfig.json, tsup.config.ts
  - Path utilities (getBaseDir, getProjectDir, getConfigPath, getProjectsDir) using os.homedir
  - Config schema (Zod) for defaultProvider, defaultModel, openaiKey, anthropicKey
  - Config load/save functions with atomic writes and EXDEV cross-device fallback
  - Commander CLI entry point with config set-key and config set-provider subcommands
  - Global config persisted to ~/.reqgen/config.json
affects: [01-02, 01-03, 02-core-dialogue, 03-output-polish]

# Tech tracking
tech-stack:
  added:
    - ai@4.3.19 (Vercel AI SDK)
    - "@ai-sdk/openai@1.3.24"
    - "@ai-sdk/anthropic@1.2.12"
    - commander@13.1.0 (CLI framework)
    - zod@3.25.76 (schema validation)
    - ora@8.2.0 (spinner)
    - chalk@5.6.2 (terminal colors)
    - jsonrepair@3.11.0 (LLM output repair)
    - tsx@4.x (dev runner)
    - tsup@8.5.1 (build bundler)
    - typescript@5.x
  patterns:
    - ESM-only module system (type:module, NodeNext resolution)
    - All local imports use .js extension (NodeNext requirement)
    - Atomic file writes via tmp + rename with EXDEV cross-device fallback
    - Immutable config updates (spread + override, never mutate)
    - os.homedir() + path.join for all path construction (no __dirname, no string concat)

key-files:
  created:
    - package.json
    - tsconfig.json
    - tsup.config.ts
    - .gitignore
    - src/utils/paths.ts
    - src/config/schema.ts
    - src/config/index.ts
    - src/bin/req.ts
  modified: []

key-decisions:
  - "Config always global (~/.reqgen/config.json) even with --local flag; only project storage is local"
  - "Atomic writes use filePath + .tmp in same directory (avoids EXDEV on Windows cross-device rename)"
  - "EXDEV fallback: copyFile + unlink for Windows compatibility when source/dest on different drives"
  - "Provider validation in CLI entry (not in config module) - clear error message with exit 1"
  - "ESM-only output (no CJS shim) - tsup format:esm, tsconfig module:NodeNext"
  - "Shebang added via tsup banner.js to dist output (not duplicating from source)"

patterns-established:
  - "Import with .js extension: all src/ relative imports use .js suffix for NodeNext ESM compatibility"
  - "Immutable updates: const updated = { ...config, [field]: value } before saveConfig"
  - "Path helpers: always use path.join(os.homedir(), ...) - never template strings or __dirname"
  - "User-facing errors: print message + process.exit(1), never throw to top-level unhandled"

requirements-completed: [INFR-05, PROJ-07]

# Metrics
duration: 11min
completed: 2026-03-02
---

# Phase 1 Plan 01: Project Scaffold and Config System Summary

**ESM TypeScript CLI scaffold with Commander config subcommands that persist API keys/provider to ~/.reqgen/config.json using atomic writes**

## Performance

- **Duration:** 11 min
- **Started:** 2026-03-02T05:36:31Z
- **Completed:** 2026-03-02T05:47:34Z
- **Tasks:** 2
- **Files modified:** 8 created

## Accomplishments
- Full ESM TypeScript project scaffold (package.json with type:module, tsconfig NodeNext, tsup build, .gitignore)
- Path utilities using os.homedir() + path.join with zero string concatenation or __dirname usage
- Zod config schema with provider/model/key fields and safe defaults
- Atomic config load/save with EXDEV cross-device fallback for Windows compatibility
- Working Commander CLI with `req config set-key <provider> <key>` and `req config set-provider <provider>`
- All 8 final verification checks pass: npm install, --help, set-key, set-provider, tsc --noEmit, build, shebang, .js imports

## Task Commits

Each task was committed atomically:

1. **Task 1: Project scaffold** - `26be5d9` (chore)
2. **Task 2: Path utilities + Config schema + Config load/save + CLI entry** - `15fa256` (feat)
3. **Lock file:** `2357169` (chore - package-lock.json)

## Files Created/Modified
- `package.json` - ESM project config with bin entry, all dependencies declared
- `tsconfig.json` - NodeNext module resolution, ES2022 target, strict mode
- `tsup.config.ts` - ESM build with shebang banner for dist/bin/req.js
- `.gitignore` - Excludes node_modules, dist, temp files, env files
- `src/utils/paths.ts` - getBaseDir/getProjectDir/getConfigPath/getProjectsDir helpers
- `src/config/schema.ts` - Zod ConfigSchema + DEFAULT_MODELS constant
- `src/config/index.ts` - loadConfig/saveConfig/getApiKey/getModel functions
- `src/bin/req.ts` - Commander CLI entry with config subcommands and error handling

## Decisions Made
- Config is always global even with --local flag: projects are local, config is not
- EXDEV fallback (Windows cross-device rename) handled in both saveConfig and any future atomic write callers
- Provider validation happens at CLI layer with clear error + exit 1 (not buried in config module)
- tsup banner adds the shebang to dist output, source file also has shebang (for tsx dev mode)

## Deviations from Plan

None - plan executed exactly as written.

Note: `src/state/atomic.ts`, `src/state/schema.ts`, and test files were found pre-existing in the repo (from a prior partial execution of plan 01-02). These did not block execution and TypeScript compiled cleanly including them.

## Issues Encountered
- Pre-existing `src/state/` files (atomic.ts, schema.ts, test files) were already in the repo from plan 01-02's TDD phase. These caused initial tsc concern but compiled successfully without changes.

## User Setup Required
None - no external service configuration required. API keys are set via `req config set-key` CLI command.

## Next Phase Readiness
- Project scaffold complete: all subsequent plans can import from src/config, src/utils/paths
- Config system ready: `loadConfig`/`saveConfig`/`getApiKey`/`getModel` available for LLM adapters
- CLI entry point ready: new commands can be added to program in src/bin/req.ts
- TypeScript compiles clean, build produces dist/bin/req.js with shebang

---
*Phase: 01-foundation*
*Completed: 2026-03-02*
