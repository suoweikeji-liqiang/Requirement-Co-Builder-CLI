# Roadmap: Requirement Co-Builder CLI

**Created:** 2026-03-02
**Depth:** Quick (3 phases)
**Requirements:** 29 v1

## Phases

- [x] **Phase 1: Foundation** - Infrastructure, LLM adapter, state/file I/O, cross-platform setup
- [x] **Phase 2: Core Dialogue** - Project management commands, dialogue engine, safety guards
- [ ] **Phase 3: Output & Polish** - Build compilation, research notes, decision log, idea.md

## Phase Details

### Phase 1: Foundation
**Goal:** The infrastructure layer is solid enough that every other component can build on it without rework.
**Depends on:** Nothing
**Requirements:** INFR-01, INFR-02, INFR-03, INFR-04, INFR-05, INFR-06, PROJ-07
**Success Criteria:**
1. Developer can call the LLM adapter with either OpenAI or Anthropic and receive a streamed response with a spinner
2. A malformed or fenced JSON response from the LLM is parsed and validated via Zod without crashing
3. State is written atomically (temp + rename) and recovers from a `.tmp` file if `state.json` is corrupt
4. All file paths resolve correctly on Windows, macOS, and Linux; Chinese characters in output render without mojibake
5. Storage location respects `--local` flag (current directory) or defaults to `~/.reqgen/projects/`

**Plans:** 3 plans

Plans:
- [x] 01-01-PLAN.md - Project scaffold + config system (package.json, tsconfig, tsup, paths, config load/save, CLI entry with `req config` commands)
- [x] 01-02-PLAN.md - Atomic state I/O + project utilities (atomic write/recovery, state schema, state read/write, project ID generation, error display)
- [x] 01-03-PLAN.md - LLM adapter + streaming display (multi-provider factory, structured output with Zod fallback, token streaming renderer with gutter indicator)

### Phase 2: Core Dialogue
**Goal:** Users can create projects, conduct multi-turn mentor-style dialogues, and trust the system to keep them thinking clearly.
**Depends on:** Phase 1
**Requirements:** PROJ-01, PROJ-02, PROJ-03, PROJ-04, PROJ-05, PROJ-06, DIAL-01, DIAL-02, DIAL-03, DIAL-04, DIAL-05, DIAL-06, DIAL-07, SAFE-01, SAFE-02, SAFE-03, SAFE-04, SAFE-05
**Success Criteria:**
1. User runs `req new "<idea>"` and immediately enters a dialogue where the system restates the idea and asks exactly one question
2. User exits mid-session, runs `req chat <id>`, and the conversation resumes with full context and correct clarity stage
3. Each dialogue round outputs a LOGIC_BASE block with sourced premises and a compressed one-liner/three-liner rewrite
4. System refuses to suggest architecture before the `structure` stage and flags abstract evaluative language without a logic chain
5. User runs `req list` and sees all projects with their current clarity stage and last-updated timestamp

**Plans:** 4 plans

Plans:
- [x] 02-01-PLAN.md - Project lifecycle commands (`new/list/open/delete`) and project service layer
- [x] 02-02-PLAN.md - Chat session engine with persistence, stage progression, five-dimension model, LOGIC_BASE, and compressed rewrites
- [x] 02-03-PLAN.md - Safety guardrails and reasoning blocks (LOGIC_CHAIN, BUSINESS_ASSUMPTION, stage/policy checks)
- [x] 02-04-PLAN.md - Snapshot command and trigger-gated knowledge explanation behavior

### Phase 3: Output & Polish
**Goal:** Users can compile a finished dialogue into actionable spec documents and maintain a research/decision trail.
**Depends on:** Phase 2
**Requirements:** OUT-01, OUT-02, OUT-03, OUT-04
**Success Criteria:**
1. User runs `req build <id>` and receives three files: `spec.md`, `acceptance.md`, `tasks.md` - all in English structured fields
2. `idea.md` reflects the latest one-liner, three-liner, structured version, stage, and open points after every dialogue round
3. User runs `req research add-note` and `req research add-link` and the entries persist in the project directory
4. `decisions.md` contains a timestamped log of every confirmed or modified point from the dialogue

**Plans:** 3 plans

Plans:
- [x] 03-01-PLAN.md - Build compiler command (`req build`) and output markdown generation (`spec.md`, `acceptance.md`, `tasks.md`)
- [x] 03-02-PLAN.md - Round-driven artifact sync for `idea.md` and `decisions.md`
- [x] 03-03-PLAN.md - Research note/link persistence commands (`req research add-note`, `req research add-link`)

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/3 | Complete | 2026-03-02 |
| 2. Core Dialogue | 4/4 | Complete | 2026-03-02 |
| 3. Output & Polish | 3/3 | In Progress | - |
