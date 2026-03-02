# Phase 2: Core Dialogue - Research

**Researched:** 2026-03-02
**Domain:** CLI project lifecycle commands, dialogue loop orchestration, safety guardrails, and session continuity
**Confidence:** HIGH

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PROJ-01 | Create project from raw idea | Add project bootstrap command `req new` backed by `createInitialState` + project metadata write |
| PROJ-02 | List projects with stage and updated time | Add project index scanner over `projects/*/state.json` and formatted table output |
| PROJ-03 | Open/view a project | Add `req open <id>` to print idea/stage/open points from persisted state |
| PROJ-04 | Delete project | Add guarded deletion command with explicit project path resolution |
| PROJ-05 | Save and resume dialogue sessions | Persist each round to state, implement `req chat <id>` resume loop |
| PROJ-06 | Create milestone snapshots | Snapshot current project files to `snapshots/<tag>/` with metadata |
| DIAL-01 | Mentor-style dialogue rhythm | Build one-round engine that restates understanding, advances one key point, and asks one question |
| DIAL-02 | Clarity stage progression | Add deterministic stage progression rules stored in state |
| DIAL-03 | Five-dimension structural model | Track Context/Actors/Intent/Mechanism/Boundary fields in state |
| DIAL-04 | LOGIC_BASE output each round | Add structured block builder for premises with source tags |
| DIAL-05 | LOGIC_CHAIN output when needed | Add causal chain extractor for CAUSE/EFFECT/ASSUMPTION |
| DIAL-06 | Compressed outputs each round | Generate one-liner, three-liner, and structured rewrite on every turn |
| DIAL-07 | One question per round | Enforce single question in response composer and post-check validator |
| SAFE-01 | Prohibit abstract evaluative language without logic | Add lexical and structure check that flags unsupported claims |
| SAFE-02 | Prohibit architecture suggestions before structure stage | Stage-gated architecture hint filter |
| SAFE-03 | Detect model-dominant rhythm | Track round cadence and warning thresholds in conversation metadata |
| SAFE-04 | Knowledge explanation only on trigger and <=3 sentences | Trigger parser for `/explain`, `/deep-dive`, `/later` and length cap logic |
| SAFE-05 | Surface BUSINESS_ASSUMPTION block | Add explicit block generator when business judgment is detected |
</phase_requirements>

## Summary

Phase 2 should be implemented as two layers: a project-command layer (`new/list/open/delete/chat/snapshot`) and a dialogue-engine layer (round execution, compression, logic blocks, safety checks). The existing Phase 1 base already provides stable config, state persistence, and LLM adapter primitives, so this phase should avoid reworking infrastructure and instead compose those primitives behind clear modules.

The most fragile area is behavioral correctness of dialogue output (exactly one question, stage gating, and guardrail enforcement). This should be handled with deterministic post-generation validators so model drift does not silently violate requirements.

**Primary recommendation:** Build a typed dialogue pipeline with explicit intermediate artifacts (analysis -> guarded transform -> render blocks), and verify each stage with unit tests plus command-level integration tests.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `commander` | ^13 | CLI command surface for project and chat commands | Already used in project, extends naturally |
| `zod` | ^3 | Runtime validation for state and dialogue payloads | Existing project standard |
| `ai` + provider adapters | ^4 + `@ai-sdk/*` | Model calls and streaming output | Already integrated in Phase 1 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `chalk` | ^5 | User-facing formatted output blocks | Rendering status and guardrail warnings |
| Node `readline/promises` | Node 18+ | Interactive CLI loop for `req chat` | Prompting user for next turn |
| `node:fs/promises` | Node 18+ | Snapshot and project file operations | Copying and deleting project artifacts |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual round loop | External conversation framework | Adds dependency and hidden behavior; current requirements are strict and custom |
| Dynamic stage inference only by LLM | Rule-based stage progression | Rule-based keeps deterministic safety gating and easier testing |

**Installation:**
```bash
# No new dependencies required for Phase 2 baseline.
```

## Architecture Patterns

### Recommended Project Structure
```text
src/
|- projects/
|  |- index.ts            # create/list/open/delete/snapshot operations
|  |- schema.ts           # project metadata validation
|- dialogue/
|  |- engine.ts           # round orchestration
|  |- prompts.ts          # system/user prompt builders
|  |- model.ts            # five-dimension model + stage transitions
|  |- guards.ts           # safety checks and policy filters
|  |- render.ts           # LOGIC_BASE / LOGIC_CHAIN / compressed output formatting
|  |- session.ts          # chat resume loop helpers
|- bin/
   |- req.ts              # command wiring
```

### Pattern 1: Pipeline Dialogue Round
**What:** Execute each chat turn through deterministic steps: input normalize -> model call -> parse -> guard -> render -> persist.
**When to use:** Every `req chat` round.

### Pattern 2: Stage-Gated Policy
**What:** Before rendering response, enforce stage-aware policy checks (for architecture suggestions and abstract claims).
**When to use:** Any assistant-generated proposal text.

### Pattern 3: Command-Oriented Persistence
**What:** Commands call a shared project service instead of reading/writing files directly from `req.ts`.
**When to use:** All project commands (`new/list/open/delete/snapshot/chat`) for consistency and testability.

### Anti-Patterns to Avoid
- Parsing assistant output directly in command handlers.
- Mixing prompt construction with CLI input/output concerns.
- Letting requirements checks rely only on prompt instructions without deterministic validators.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Interactive terminal loop | Custom raw stdin parsing | `readline/promises` | Handles prompts, line buffering, and close semantics |
| Structured output validation | Ad-hoc object checks | `zod` schemas | Better error surfaces and predictable parsing |
| File tree copy for snapshots | Manual recursive loops everywhere | Centralized snapshot utility in `projects/index.ts` | Reduces path and error-handling bugs |

**Key insight:** Keep model behavior and policy enforcement separate. Prompting alone is not enough for strict product invariants.

## Common Pitfalls

### Pitfall 1: One-question rule drift
**What goes wrong:** Assistant emits multiple questions in one turn.
**Why it happens:** Prompt adherence is probabilistic.
**How to avoid:** Post-process and validate question count; fail or rewrite if >1.
**Warning signs:** Frequent multi-question replies under complex prompts.

### Pitfall 2: Stage policy bypass
**What goes wrong:** Architecture suggestions appear before `structure` stage.
**Why it happens:** Model inference over-optimizes for solutioning.
**How to avoid:** Explicit stage gate in code before final render.
**Warning signs:** Replies containing technology stack choices during concept stage.

### Pitfall 3: Session resume inconsistency
**What goes wrong:** `req chat <id>` resumes with stale or malformed state.
**Why it happens:** Missing validation and absent migration guard.
**How to avoid:** Validate state on load and hard-fail with actionable error when corrupted.
**Warning signs:** Missing turns or stage regressions after restart.

### Pitfall 4: Snapshot incompleteness
**What goes wrong:** Snapshot misses required artifacts (`state.json`, notes).
**Why it happens:** Copy logic is path-fragile.
**How to avoid:** Explicit required file list and post-copy verification.
**Warning signs:** Snapshot directory exists but cannot restore conversation context.

## Code Examples

### Stage progression contract
```typescript
export type ClarityStage = 'concept' | 'direction' | 'structure' | 'executable';

export interface DialogueProjection {
  stage: ClarityStage;
  dimensions: {
    context: string;
    actors: string;
    intent: string;
    mechanism: string;
    boundary: string;
  };
}
```

### One-question validator
```typescript
export function countQuestions(text: string): number {
  return (text.match(/\?/g) ?? []).length;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Prompt-only safety control | Prompt + deterministic post-checks | Current best practice for production LLM apps | Reduces silent policy violations |
| Monolithic command files | Service modules + command wiring | Existing project trend in Phase 1 | Easier testing and plan parallelization |

## Open Questions

1. **Stage transition confidence threshold**
   - What we know: state already stores stage and supports progression.
   - What's unclear: exact threshold logic for moving stages.
   - Recommendation: start with deterministic rules based on dimension completeness and allow later tuning.

2. **LOGIC_CHAIN extraction strictness**
   - What we know: requirement only mandates output when causal reasoning appears.
   - What's unclear: whether to suppress weak chains or include best-effort.
   - Recommendation: include only when parser finds explicit cause/effect markers, else omit block.

## Sources

### Primary (HIGH confidence)
- Local codebase (Phase 1 summaries and source files)
- Existing roadmap and requirements documents

### Secondary (MEDIUM confidence)
- Existing Phase 1 research document for stack/pitfall continuity

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - already implemented in this repo
- Architecture: HIGH - derived from current code boundaries and phase requirements
- Pitfalls: HIGH - aligned to requirement invariants and previous execution findings

**Research date:** 2026-03-02
**Valid until:** 2026-04-02
