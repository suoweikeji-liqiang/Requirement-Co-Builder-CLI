# Feature Landscape

**Domain:** CLI-based AI-assisted requirement clarification / idea-to-spec tools
**Researched:** 2026-03-02
**Confidence:** MEDIUM (ecosystem verified via SpecKit, Copilot Workspace, OpenSpec official sources; differentiators are project-specific design)

---

## Table Stakes

Features users expect. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| Project creation & management | Every CLI tool needs a named workspace to persist state | Low | File system, config schema | `init`, `list`, `open`, `delete` commands |
| Multi-turn dialogue with context persistence | Single-turn Q&A loses thread; users expect the AI to remember what was said | Medium | Session store, LLM context window management | Context must survive process restarts |
| Save / resume sessions | Users don't finish in one sitting; losing progress is a dealbreaker | Medium | Serialized session format (JSON/YAML) | Must restore full dialogue history + current stage |
| Structured output: one-liner, summary, detailed spec | Different audiences need different granularity; SpecKit's 7-phase workflow confirms this pattern | Medium | Output renderer, template engine | One-liner = elevator pitch; summary = 1-page; spec = full document |
| Export to Markdown | Markdown is the universal handoff format for AI coding tools (Claude Code, Copilot, Cursor) | Low | Markdown serializer | Must be clean enough to feed directly into downstream AI agents |
| Basic input validation & error recovery | CLI tools that crash on bad input feel unfinished | Low | None | Graceful handling of empty input, Ctrl+C, malformed answers |

---

## Differentiators

Features that set this product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| Clarity stage progression | Prevents users from jumping to solutions before the problem is understood; mirrors SpecKit's constitution → specify → clarify pipeline | Medium | Stage machine, stage transition rules | Stages: Vague Idea → Problem Definition → User & Context → Solution Shape → Constraints → Spec Draft → Review |
| Five-dimension structural model | Forces completeness — ensures the spec covers Who, What, Why, How, and Constraints rather than just feature lists | Medium | Dimension tracker, completeness scorer | Surfaces gaps explicitly: "You haven't defined success criteria yet" |
| Logic premise visualization | Shows the user the reasoning chain behind their requirements so they can spot contradictions before they become bugs | High | Dependency graph builder, terminal renderer (tree/ASCII) | Inspired by how Copilot Workspace shows a plan before executing; surfaces "Feature B assumes Feature A exists" |
| Anti-rhythm-hijacking mechanisms | Prevents the AI from leading the user toward a predetermined answer; keeps the user's intent primary | Medium | Prompt design, response auditing layer | Detects when AI is filling in blanks vs. genuinely clarifying; flags assumptions explicitly |
| Controlled knowledge explanation | Explains domain concepts inline when the user is confused, without derailing the dialogue | Medium | Knowledge injection layer, topic detector | e.g., user says "I want OAuth" — tool briefly explains tradeoffs before asking which flow they need |
| Mentor-style dialogue tone | Cooperative, not interrogative; builds user confidence rather than making them feel they're filling out a form | Low | Prompt engineering | Differentiates from form-filling tools like Jira templates |

---

## Anti-Features

Things to deliberately NOT build in v1.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Web UI | Adds frontend build complexity, auth, hosting — none of which serve the core dialogue loop | Stay CLI; the target user is a developer comfortable in terminal |
| Team collaboration / multi-user sessions | Requires conflict resolution, permissions, real-time sync — a separate product surface | Single-user focus; export Markdown for sharing |
| Auto web scraping / competitor research | Scope creep; unreliable, legally ambiguous, and distracts from the dialogue engine | Let users paste in context manually if needed |
| Complex plugin / extension system | Premature abstraction; plugin APIs need stable internals first | Hard-code the core pipeline; extract plugin interfaces in v2 after patterns stabilize |
| Code generation | This tool ends at the spec; code generation is a downstream concern for Copilot/Claude Code | Export spec as Markdown handoff to coding agents |
| Voice input | Adds transcription dependency, latency, and accessibility complexity | Text-only in v1; voice is a v3+ consideration |

---

## Feature Dependencies

```
Project creation
  └── Session save/resume
        └── Multi-turn dialogue
              └── Clarity stage progression
                    └── Five-dimension structural model
                          └── Completeness scoring
                                └── Structured output (one-liner / summary / spec)
                                      └── Export to Markdown

Multi-turn dialogue
  └── Anti-rhythm-hijacking mechanisms
  └── Controlled knowledge explanation

Structured output
  └── Logic premise visualization (optional overlay on spec)
```

---

## MVP Recommendation

Prioritize (in order):

1. Project creation + session save/resume — without persistence, nothing else matters
2. Multi-turn dialogue with context — the core loop
3. Clarity stage progression — the primary differentiator; prevents the most common failure mode (jumping to solutions)
4. Structured output + Markdown export — the deliverable users actually need
5. Five-dimension structural model — completeness enforcement, medium effort, high perceived value

Defer to v2:
- Logic premise visualization — High complexity, needs stable data model first
- Anti-rhythm-hijacking — Requires evaluation harness to verify it works; ship prompt design first, formalize detection later
- Controlled knowledge explanation — Nice to have; can be approximated with good prompt design in v1

---

## Sources

- [Deep Dive into SpecKit](https://blog.lpains.net/posts/2025-12-07-deep-dive-into-speckit/) — 7-phase workflow (constitution, specify, clarify, plan, tasks, analyze, implement); MEDIUM confidence
- [GitHub Spec Kit official](https://speckit.org/) — Spec-driven development pattern; MEDIUM confidence
- [speckit-clarify skill](https://playbooks.com/skills/dceoy/speckit-agent-skills/speckit-clarify) — "up to 5 targeted clarification questions" pattern; MEDIUM confidence
- [Copilot Workspace user manual](https://github.com/githubnext/copilot-workspace-user-manual) — Task-centric, plan-before-execute pattern; MEDIUM confidence
- [GitHub Copilot Handbook — spec agent](https://nikiforovall.blog/github-copilot-rules/customizations/agents/spec) — "in-depth interviews to create specification documents"; MEDIUM confidence
- [Spec-Plan-Execute pattern](https://slavakurilyak.com/posts/drafts/spec-plan-execute) — Structured spec → plan → execute pipeline; LOW confidence (single source)
- [AI Tools for Requirements Gathering 2026](https://clickup.com/blog/ai-tools-for-requirements-gathering/) — Market landscape; LOW confidence (marketing content)
