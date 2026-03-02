---
phase: 01-foundation
plan: 03
subsystem: infra
tags: [llm, ai-sdk, openai, anthropic, streaming, zod, jsonrepair]

requires:
  - 01-01
  - 01-02
provides:
  - "LLM adapter factory supporting OpenAI and Anthropic with explicit API key passing"
  - "Token streaming adapter method with callback-based output and accumulated return text"
  - "Structured generation with primary Output.object flow and jsonrepair-based fallback"
  - "Streaming display renderer with gutter prefix, separator line, and interruption hint"
affects:
  - "02-core-dialogue"
  - "03-output-polish"
  - "all dialogue turns using LLM output"

tech-stack:
  added: []
  patterns:
    - "Provider selection through explicit factory branch and strict unknown-provider rejection"
    - "Two-step structured parse strategy: SDK structured output then repaired raw JSON fallback"
    - "Display streaming kept as pure I/O concern (no spinner ownership)"

key-files:
  created:
    - "src/adapters/llm.ts"
    - "src/display/stream.ts"
    - "src/display/stream.test.ts"
  modified: []

key-decisions:
  - "Used AI SDK v4 experimental_output with Output.object because project dependency is ai@^4.0.0."
  - "Kept spinner lifecycle outside streamResponse to avoid interleaving and preserve single responsibility."
  - "Validated stream behavior through captured stdout/stderr tests instead of real network calls."

patterns-established:
  - "Pattern: Adapter methods accept Message[] and cast to CoreMessage[] at AI SDK boundary."
  - "Pattern: Fallback JSON repair path always ends with schema.parse for typed safety."
  - "Pattern: Stream renderer writes output directly via process.stdout.write and rethrows on interruption."

requirements-completed:
  - INFR-01
  - INFR-02
  - INFR-03
  - INFR-06

duration: 1h 24m
completed: 2026-03-02
---

# Phase 1 Plan 03: LLM Adapter and Streaming Display Summary

**Multi-provider LLM adapter with structured-output fallback and a real-time streaming renderer for CLI dialogue output**

## Performance

- **Duration:** 1h 24m
- **Started:** 2026-03-02T06:36:27Z
- **Completed:** 2026-03-02T08:00:24Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Implemented `createLLMAdapter` for OpenAI/Anthropic with explicit API key injection and unknown-provider guard.
- Implemented adapter `streamText` token callback flow and `generateStructured` fallback pipeline (strip fenced JSON -> `jsonrepair` -> `JSON.parse` -> `schema.parse`).
- Implemented `streamResponse` renderer with gutter prefix, token passthrough, separator line, interruption hint, and one-time Windows encoding warning.
- Added streaming renderer tests with stdout/stderr capture and verified full suite stability.

## Task Commits

Each task was committed atomically:

1. **Task 1: LLM adapter implementation (TDD)** - `696043c` (test), `1cec024` (feat)
2. **Task 2: Streaming display renderer (TDD)** - `a9eb446` (test), `0e19628` (feat)

**Plan metadata:** _(docs commit follows)_

_Note: TDD tasks used RED -> GREEN commit pairs._

## Files Created/Modified

- `src/adapters/llm.ts` - LLM adapter interface and provider factory with streaming + structured generation fallback.
- `src/display/stream.ts` - Token streaming output renderer with gutter/separator and interruption handling.
- `src/display/stream.test.ts` - Renderer tests for output framing and error-path behavior.

## Decisions Made

- Used AI SDK v4 `experimental_output: Output.object(...)` API to match current dependency version.
- Kept rendering logic free of spinner concerns so callers own spinner stop/start sequencing.
- Added Windows non-UTF-8 warning as a one-time stderr hint without blocking execution.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Node type mismatch for stdout encoding access**
- **Found during:** Task 2 verification
- **Issue:** `process.stdout.encoding` is not declared on the current `@types/node` stream type.
- **Fix:** Added a narrow type cast for optional `encoding` access in `stream.ts`.
- **Files modified:** `src/display/stream.ts`
- **Verification:** `npx tsc --noEmit` succeeds; stream tests pass.
- **Committed in:** `0e19628`

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Required type-level fix only; no scope creep or behavior change.

## Issues Encountered

- `tsx -e` verification snippets failed in this sandbox with `spawn EPERM` from `esbuild`. Equivalent behavior was verified through Jest tests and TypeScript compile checks.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 1 core LLM and stream infrastructure is complete and test-verified.
- Ready for Phase 2 (`Core Dialogue`) planning/execution.
- Remaining concern: AI SDK major-version mismatch in historical notes (state mentions v5 while package currently uses v4 API surface).

## Self-Check: PASSED

- `src/adapters/llm.ts`: FOUND
- `src/display/stream.ts`: FOUND
- `src/display/stream.test.ts`: FOUND
- `git log --oneline --all --grep="01-03"`: FOUND 4 commits
- Full tests: PASS (7 suites, 58 tests)
- TypeScript: PASS (`npx tsc --noEmit`)

---
*Phase: 01-foundation*
*Completed: 2026-03-02*
