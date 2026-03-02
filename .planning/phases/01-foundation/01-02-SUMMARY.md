---
phase: 01-foundation
plan: 02
subsystem: infra
tags: [node, typescript, esm, atomic-io, state, zod, chalk, crypto]

requires: []
provides:
  - "atomicWrite function: temp-file-then-rename with EXDEV fallback (src/state/atomic.ts)"
  - "readStateWithRecovery function: reads state.json with .tmp promotion on corruption"
  - "ProjectStateSchema: Zod schema for project state with clarityStage progression"
  - "MessageSchema: Zod schema for dialogue messages with role/content/timestamp"
  - "readProjectState: reads + validates state.json, returns null on missing/corrupt"
  - "writeProjectState: atomically persists new state object (immutable, updates updatedAt)"
  - "createInitialState: factory for fresh ProjectState with concept stage, empty messages"
  - "generateProjectId: 4-char hex hash + idea slug (e.g. a3f2-build-a-cli-tool)"
  - "formatError: user-friendly error strings without stack traces"
  - "printError: stderr error writer using chalk.red"
affects:
  - "02-core-dialogue"
  - "03-output-polish"
  - "any phase that reads/writes project state"

tech-stack:
  added:
    - "node:crypto (built-in) — SHA-256 for project ID generation"
    - "zod@3.x — flat schema validation for state and messages"
    - "chalk@5.x — ESM terminal color for error output"
  patterns:
    - "Atomic temp+rename write pattern with EXDEV catch-and-copy fallback"
    - "Crash recovery: .tmp promotion to main file on startup"
    - "Immutable state updates: spread operator produces new object before write"
    - "Zod safeParse returning null on failure (caller decides recovery strategy)"
    - "TDD: RED (failing tests) → GREEN (minimal implementation) per task"

key-files:
  created:
    - "src/state/atomic.ts — atomicWrite + readStateWithRecovery"
    - "src/state/schema.ts — ProjectStateSchema + MessageSchema + exported types"
    - "src/state/index.ts — readProjectState + writeProjectState + createInitialState"
    - "src/utils/id.ts — generateProjectId with hash + slug + Chinese fallback"
    - "src/display/errors.ts — formatError + printError"
    - "src/state/atomic.test.ts — 9 tests for atomic I/O behavior"
    - "src/state/schema.test.ts — 8 tests for Zod schema validation"
    - "src/state/index.test.ts — 11 tests for state read/write/create"
    - "src/utils/id.test.ts — 8 tests for ID generation"
    - "src/display/errors.test.ts — 8 tests for error formatting"
  modified:
    - "package.json — Jest config: --experimental-vm-modules for chalk ESM compat, transformIgnorePatterns"

key-decisions:
  - "TDD approach applied to both tasks: wrote failing tests before implementation"
  - "Jest uses --experimental-vm-modules (node_modules/jest/bin/jest.js path) to handle ESM chalk on Windows"
  - "Zod v3 used (installed) instead of planned v4 — flat schemas fully compatible; upgrading deferred"
  - "generateProjectId fallback slug is 'project' for non-ASCII (Chinese) idea strings"
  - "writeProjectState produces new object via spread — original state object never mutated"
  - "readProjectState returns null on Zod validation failure (treat corrupt as missing)"

patterns-established:
  - "Pattern: All state mutations go through atomicWrite (temp+rename, never direct write)"
  - "Pattern: readStateWithRecovery used for all state reads (crash recovery built-in)"
  - "Pattern: Zod safeParse with null return (not throws) for graceful degradation"
  - "Pattern: Immutable state updates via spread before write (no mutation)"
  - "Pattern: formatError + printError for all user-facing error display"

requirements-completed:
  - INFR-04
  - INFR-05

duration: 28min
completed: 2026-03-02
---

# Phase 1 Plan 02: Atomic I/O Layer, State Schema, ID Generator, and Error Display Summary

**Atomic temp+rename state persistence with crash recovery, Zod-validated project state schema, SHA-256 project ID generator, and stderr error formatter — 44 unit tests passing**

## Performance

- **Duration:** 28 min
- **Started:** 2026-03-02T08:57:01Z
- **Completed:** 2026-03-02T09:25:00Z
- **Tasks:** 2
- **Files modified:** 11 (5 source, 5 test, 1 config)

## Accomplishments

- atomicWrite writes temp file in same directory (not os.tmpdir), renames atomically, catches EXDEV on Windows and falls back to copyFile+unlink
- readStateWithRecovery promotes .tmp to main file on corruption, returns null when both missing — crash-safe state reads
- ProjectStateSchema (Zod) validates all project state fields including clarityStage progression enum
- writeProjectState creates a new state object via spread (immutable), updates updatedAt, writes atomically
- generateProjectId produces collision-resistant IDs like "a3f2-build-a-cli-tool" with Chinese-text fallback
- formatError/printError provide user-friendly stderr output with no stack trace exposure
- 44 unit tests across 5 test suites — all passing

## Task Commits

Each task was committed atomically:

1. **Task 1: Atomic write layer + Project state schema** - `b789b0a` (feat)
2. **Task 2: State read/write + Project ID generator + Error display** - `3696a36` (feat)

**Plan metadata:** _(docs commit follows)_

_Note: TDD tasks had single commits each (test files + implementation in same commit after RED/GREEN cycle)_

## Files Created/Modified

- `src/state/atomic.ts` — atomicWrite (temp+rename+EXDEV) and readStateWithRecovery (.tmp promotion)
- `src/state/schema.ts` — ProjectStateSchema and MessageSchema (Zod v3, flat schemas)
- `src/state/index.ts` — readProjectState, writeProjectState, createInitialState
- `src/utils/id.ts` — generateProjectId: SHA-256(idea+Date.now()).slice(4) + idea slug
- `src/display/errors.ts` — formatError (no stack traces) and printError (stderr + chalk.red)
- `src/state/atomic.test.ts` — 9 unit tests: atomicWrite, readStateWithRecovery behaviors
- `src/state/schema.test.ts` — 8 unit tests: Zod schema validation and rejection cases
- `src/state/index.test.ts` — 11 unit tests: read/write/create with round-trip and immutability checks
- `src/utils/id.test.ts` — 8 unit tests: ID format, uniqueness, Chinese text, special chars
- `src/display/errors.test.ts` — 8 unit tests: formatError types, printError stderr verification
- `package.json` — Updated Jest config: use jest.js directly for Windows + transformIgnorePatterns for chalk

## Decisions Made

- **TDD applied**: Wrote all failing tests first, then implemented to pass them. Confirms behavior matches specification before code is written.
- **Jest ESM fix**: chalk v5 is ESM-only. On Windows, the npm test shebang failed (bash path issue). Fixed by calling `node_modules/jest/bin/jest.js` directly with `--experimental-vm-modules`. Also added `transformIgnorePatterns` to allow chalk through without transformation.
- **Zod v3 vs v4**: package.json specifies `zod@^3.0.0` (v3.25 installed). The plan mentioned v4 schemas, but the flat schema shapes (object, string, boolean, enum, array) are identical between v3 and v4. No migration needed for Phase 1 schemas.
- **generateProjectId slug fallback**: Chinese-only idea strings produce empty slug after stripping non-ASCII. Fallback to 'project' makes IDs valid and readable: "a3f2-project".
- **Immutable writeProjectState**: Original state object is never mutated. `{ ...state, updatedAt: ... }` creates a new object — verified by test asserting original `updatedAt` unchanged after write.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Jest ESM module compatibility for chalk**
- **Found during:** Task 2 (errors.test.ts)
- **Issue:** chalk v5 is ESM-only; Jest's ts-jest preset in CJS mode throws "Cannot use import statement outside a module" when importing chalk
- **Fix:** Updated Jest test script to use `node_modules/jest/bin/jest.js` (avoids Windows bash shebang issue in `node_modules/.bin/jest`) with `--experimental-vm-modules` flag; added `transformIgnorePatterns` to allow chalk's ESM through
- **Files modified:** `package.json`
- **Verification:** All 8 `errors.test.ts` tests pass; all 44 tests pass together
- **Committed in:** `3696a36` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug fix for test environment compatibility)
**Impact on plan:** Necessary fix for test infrastructure. No scope creep. Source implementations exactly as specified.

## Issues Encountered

- Zod version mismatch: package.json had `^3.0.0` but plan referenced v4 API. Flat schemas are fully compatible — no code change needed, only noted as decision.
- Windows path issue with `node_modules/.bin/jest` shebang — resolved by invoking jest.js directly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- State layer is complete and fully tested — Phase 2 can import `readProjectState`, `writeProjectState`, `createInitialState` directly from `src/state/index.ts`
- generateProjectId is ready for Phase 2 project creation commands
- formatError and printError are ready for use in all Phase 2 command error handlers
- No blockers for Phase 2 or Phase 1 Plan 3 (LLM adapter)

## Self-Check: PASSED

- src/state/atomic.ts: FOUND
- src/state/schema.ts: FOUND
- src/state/index.ts: FOUND
- src/utils/id.ts: FOUND
- src/display/errors.ts: FOUND
- .planning/phases/01-foundation/01-02-SUMMARY.md: FOUND
- Commit b789b0a (Task 1): FOUND
- Commit 3696a36 (Task 2): FOUND
- 44 tests: PASSING
- TypeScript: npx tsc --noEmit exits 0

---
*Phase: 01-foundation*
*Completed: 2026-03-02*
