# Phase 3: Output & Polish - Research

**Researched:** 2026-03-02
**Domain:** Output document compilation, project artifact generation, and research/decision logging flows
**Confidence:** HIGH

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| OUT-01 | `req build` compiles state into `spec.md`, `acceptance.md`, `tasks.md` | Add a pure build compiler module that reads current state and writes deterministic markdown files |
| OUT-02 | `idea.md` auto-updates each round | Add an artifact writer called after each successful chat round persistence |
| OUT-03 | `req research add-note` and `req research add-link` persist entries | Add research service that appends normalized markdown entries in project directory |
| OUT-04 | `decisions.md` logs confirmation/modification points | Add decision log writer integrated into round lifecycle with timestamped entries |
</phase_requirements>

## Summary

Phase 3 should add output-focused project services without changing the existing dialogue core. The safest design is to keep compilation and artifact rendering deterministic and file-based, with command handlers thin and test-driven, matching patterns already used in `projects` and `dialogue` modules.

`OUT-02` and `OUT-04` should integrate inside the chat session after state write succeeds, so markdown artifacts always reflect persisted state, not speculative in-memory turns. `OUT-01` and `OUT-03` are command-driven and can be built as isolated services wired into `req.ts`.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node `fs/promises` | Node 18+ | Output file creation and append workflows | Existing file I/O foundation in project |
| `commander` | ^13 | CLI command wiring (`req build`, `req research`) | Already the command surface |
| `zod` | ^3 | Input normalization and contract validation | Existing runtime validation standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Existing state/project services | Local modules | Load and validate project state before writing artifacts | Every output command |
| Jest + ts-jest | Existing | Deterministic file-output and command wiring tests | TDD for all new behavior |

**Installation:**
```bash
# No new dependencies required.
```

## Architecture Patterns

### Pattern 1: Deterministic Markdown Renderers
Use pure render helpers (`state -> markdown string`) and separate filesystem write helpers. This keeps output predictable and easy to test.

### Pattern 2: Session-Coupled Artifact Sync
After each successful chat round write, update `idea.md` and `decisions.md` from persisted round artifacts. Never update artifacts before state save.

### Pattern 3: Service-First Command Design
`req build` and `req research *` commands should call service modules under `src/projects`/`src/output`, keeping `req.ts` as orchestration only.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Markdown formatting in command bodies | Inline string concatenation in `req.ts` | Dedicated renderer helpers | Reduces drift and formatting bugs |
| Project lookup logic per command | Repeated path/file existence checks | Existing `openProject` and project dir helpers | Consistent error behavior |
| Unsafe overwrite behavior | Blind writes without atomic flow | Existing `atomicWrite` for critical outputs where needed | Prevents partial writes |

## Common Pitfalls

### Pitfall 1: Output files drifting from state
If output is generated from stale in-memory objects, files can diverge from `state.json`. Always read persisted state or sequence writes carefully.

### Pitfall 2: Decision log noise
Logging every round verbatim creates unreadable `decisions.md`. Use concise timestamped entries and only include explicit confirmations/modifications.

### Pitfall 3: Command-surface sprawl
Mixing research persistence rules inside CLI handler code increases coupling. Keep append/validation in service modules with tests.

## Open Questions

1. Should `req build` overwrite existing output files or keep timestamped variants?
Recommendation: overwrite canonical files (`spec.md`, `acceptance.md`, `tasks.md`) for deterministic downstream consumption.

2. What heuristic marks a turn as a decision update for `decisions.md`?
Recommendation: start with explicit user/assistant signals (`confirm`, `change`, `decide`, `update`) and iterate later.

## Metadata

**Confidence breakdown:**
- Stack/tooling: HIGH (already present in repo)
- Architecture: HIGH (follows established Phase 2 patterns)
- Requirement fit: HIGH (direct mapping to OUT-01..04)

**Research date:** 2026-03-02
**Valid until:** 2026-04-02
