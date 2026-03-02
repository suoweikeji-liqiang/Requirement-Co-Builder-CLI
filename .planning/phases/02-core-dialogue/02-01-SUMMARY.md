---
phase: 02-core-dialogue
plan: 01
subsystem: api
tags: [cli, projects, state, commander]
requires:
  - 01-foundation
provides:
  - "Project lifecycle service for create/list/open/delete operations"
  - "CLI command wiring for req new/list/open/delete"
affects:
  - "02-02"
  - "02-04"
  - "project management UX"
tech-stack:
  added: []
  patterns:
    - "Service-layer project operations under src/projects with command wiring in src/bin/req.ts"
    - "Global option propagation using Commander optsWithGlobals for --local behavior"
key-files:
  created:
    - "src/projects/index.ts"
    - "src/projects/schema.ts"
    - "src/projects/index.test.ts"
    - "src/bin/req.test.ts"
  modified:
    - "src/bin/req.ts"
key-decisions:
  - "Exported buildProgram from req.ts to make command registration testable without executing the CLI parser."
  - "listProjects ignores invalid/corrupt project state entries instead of crashing command output."
patterns-established:
  - "Command handlers call projects service functions; no direct filesystem persistence in command bodies."
  - "Project state resolution uses existing Phase 1 primitives (createInitialState/readProjectState/writeProjectState)."
requirements-completed:
  - PROJ-01
  - PROJ-02
  - PROJ-03
  - PROJ-04
duration: 42min
completed: 2026-03-02
---

# Phase 2 Plan 01: Project Lifecycle Commands Summary

**Implemented a tested project lifecycle service and wired `req new/list/open/delete` commands with consistent `--local` behavior**

## Performance

- **Duration:** 42 min
- **Started:** 2026-03-02T08:12:00Z
- **Completed:** 2026-03-02T08:54:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Added `src/projects/index.ts` with create/list/open/delete service operations over existing state/id/path helpers.
- Added `src/projects/schema.ts` with typed list/create result contracts.
- Added lifecycle service tests (`src/projects/index.test.ts`) covering create/list/open/delete behavior and error path.
- Refactored CLI to export `buildProgram` and added project lifecycle commands in `src/bin/req.ts`.
- Added command wiring test (`src/bin/req.test.ts`) verifying required commands are registered.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create project service and metadata schema (TDD)** - `9ee799f` (test), `dcf27a8` (feat)
2. **Task 2: Wire req new/list/open/delete commands (TDD)** - `b20bf57` (test), `214d57b` (feat)

**Plan metadata:** _(docs commit follows)_

## Files Created/Modified

- `src/projects/index.ts` - project lifecycle service methods.
- `src/projects/schema.ts` - list/create project schemas and types.
- `src/projects/index.test.ts` - service behavior tests.
- `src/bin/req.ts` - command registration for new/list/open/delete and program export.
- `src/bin/req.test.ts` - command registration test.

## Decisions Made

- Added `buildProgram()` export to allow deterministic CLI wiring tests.
- Kept project commands thin and delegated persistence logic to `src/projects/index.ts`.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- `tsx`-based command verification is blocked in this sandbox by `spawn EPERM` from esbuild. Equivalent behavior was validated with Jest tests and TypeScript compilation.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Core project lifecycle commands are available.
- Phase 2 chat/session implementation can now depend on stable project creation and lookup flows.

## Self-Check: PASSED

- `src/projects/index.ts`: FOUND
- `src/projects/schema.ts`: FOUND
- `src/projects/index.test.ts`: FOUND
- `src/bin/req.ts`: FOUND
- `src/bin/req.test.ts`: FOUND
- lifecycle tests: PASS
- CLI wiring test: PASS
- TypeScript: PASS (`npx tsc --noEmit`)

---
*Phase: 02-core-dialogue*
*Completed: 2026-03-02*
