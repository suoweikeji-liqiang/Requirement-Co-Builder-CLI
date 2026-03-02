# Requirements: Requirement Co-Builder CLI

**Defined:** 2026-03-02
**Core Value:** 通过结构化对话让模糊想法逐轮收敛为可执行的需求描述，同时保持人对思考过程的主导权。

## v1 Requirements

### Project Management

- [ ] **PROJ-01**: User can create a new project from a raw idea sentence (`req new "<idea>"`)
- [ ] **PROJ-02**: User can list all projects with stage and last-updated (`req list`)
- [ ] **PROJ-03**: User can open/view a project (`req open <id>`)
- [ ] **PROJ-04**: User can delete a project
- [ ] **PROJ-05**: User can save and resume dialogue sessions (`req chat <id>` restores full context)
- [ ] **PROJ-06**: User can create milestone snapshots (`req snapshot <id> --tag v0.1`)
- [ ] **PROJ-07**: User can configure storage location (global `~/.reqgen/` or `--local` current directory)

### Dialogue Engine

- [ ] **DIAL-01**: System conducts mentor-style dialogue: restate understanding, advance one point, compress rewrite each round
- [ ] **DIAL-02**: System tracks clarity stage progression (concept → direction → structure → executable)
- [ ] **DIAL-03**: System maintains five-dimension structural model (Context / Actors / Intent / Mechanism / Boundary)
- [ ] **DIAL-04**: System outputs LOGIC_BASE (explicit premises with source tags) each round
- [ ] **DIAL-05**: System outputs LOGIC_CHAIN (CAUSE/EFFECT/ASSUMPTION) when causal reasoning appears
- [ ] **DIAL-06**: System generates compressed versions each round: one-liner / three-liner / structured
- [ ] **DIAL-07**: System asks only 1 question per round (no question bombardment)

### Safety Guards

- [ ] **SAFE-01**: System prohibits abstract evaluative language (better/optimal/advanced) without logic chain
- [ ] **SAFE-02**: System prohibits architecture suggestions before structure stage
- [ ] **SAFE-03**: System detects model-dominant rhythm (consecutive rounds without questions or with excessive suggestions)
- [ ] **SAFE-04**: Knowledge explanation only on user trigger (`/explain` `/deep-dive` `/later`), ≤8 sentences, with confidence tag
- [ ] **SAFE-05**: Business assumptions explicitly surfaced (BUSINESS_ASSUMPTION block) when business judgments appear

### Output & Compilation

- [ ] **OUT-01**: `req build` compiles state into spec.md + acceptance.md + tasks.md
- [ ] **OUT-02**: idea.md auto-updates each round with one-liner / three-liner / structured / stage / open points
- [ ] **OUT-03**: User can add research notes (`req research add-note`) and links (`req research add-link`)
- [ ] **OUT-04**: Decision log (decisions.md) records confirmation/modification points from dialogue

### Infrastructure

- [ ] **INFR-01**: Multi-provider LLM support (OpenAI, Anthropic) via configurable adapter
- [ ] **INFR-02**: Streaming LLM responses for responsive UX
- [ ] **INFR-03**: Structured output parsing with fallback/retry on malformed responses
- [ ] **INFR-04**: Atomic file writes (temp + rename) for crash safety
- [ ] **INFR-05**: Cross-platform support (Windows / macOS / Linux) with correct path and encoding handling
- [ ] **INFR-06**: Dialogue language Chinese, structured output fields English

## v2 Requirements

### Enhanced Intelligence

- **INTEL-01**: Completeness scoring algorithm for five dimensions
- **INTEL-02**: Logic premise dependency graph visualization
- **INTEL-03**: Auto-detect knowledge gaps and suggest `/explain` topics
- **INTEL-04**: Context window management with rolling summary injection

### Modes & Extensions

- **MODE-01**: Risk verification / evidence audit mode (B-mode)
- **MODE-02**: Architecture restructuring mode
- **MODE-03**: Plugin system for custom research providers
- **MODE-04**: Auto web search for competitor research

## Out of Scope

| Feature | Reason |
|---------|--------|
| Web UI / GUI | CLI-first for developer users; adds unnecessary complexity |
| Team collaboration | Single-user tool; export Markdown for sharing |
| Code generation | Ends at spec; downstream tools handle code |
| Voice input | Text-only in v1; adds transcription dependency |
| Complex plugin system | Premature; extract interfaces in v2 after patterns stabilize |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PROJ-01 | Phase 2 | Pending |
| PROJ-02 | Phase 2 | Pending |
| PROJ-03 | Phase 2 | Pending |
| PROJ-04 | Phase 2 | Pending |
| PROJ-05 | Phase 2 | Pending |
| PROJ-06 | Phase 2 | Pending |
| PROJ-07 | Phase 1 | Pending |
| DIAL-01 | Phase 2 | Pending |
| DIAL-02 | Phase 2 | Pending |
| DIAL-03 | Phase 2 | Pending |
| DIAL-04 | Phase 2 | Pending |
| DIAL-05 | Phase 2 | Pending |
| DIAL-06 | Phase 2 | Pending |
| DIAL-07 | Phase 2 | Pending |
| SAFE-01 | Phase 2 | Pending |
| SAFE-02 | Phase 2 | Pending |
| SAFE-03 | Phase 2 | Pending |
| SAFE-04 | Phase 2 | Pending |
| SAFE-05 | Phase 2 | Pending |
| OUT-01 | Phase 3 | Pending |
| OUT-02 | Phase 3 | Pending |
| OUT-03 | Phase 3 | Pending |
| OUT-04 | Phase 3 | Pending |
| INFR-01 | Phase 1 | Pending |
| INFR-02 | Phase 1 | Pending |
| INFR-03 | Phase 1 | Pending |
| INFR-04 | Phase 1 | Pending |
| INFR-05 | Phase 1 | Pending |
| INFR-06 | Phase 1 | Pending |

**Coverage:**
- v1 requirements: 29 total
- Mapped to phases: 29
- Unmapped: 0

---
*Requirements defined: 2026-03-02*
*Last updated: 2026-03-02 after roadmap creation*
