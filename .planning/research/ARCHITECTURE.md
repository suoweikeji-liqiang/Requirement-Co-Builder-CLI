# Architecture Research: Requirement Co-Builder CLI

**Domain:** Node.js/TypeScript CLI tool for LLM-driven requirements dialogue
**Researched:** 2026-03-02
**Overall confidence:** HIGH (patterns well-established in Node.js CLI + LLM ecosystem)

---

## Components

### 1. CLI Layer
**Responsibility:** Entry point. Parses argv (new/resume/build/config commands), sets up readline interface, renders output to terminal, handles Ctrl+C / graceful exit.

**Interfaces:**
- Receives raw user text strings → passes to Dialogue Engine
- Receives `DisplayPayload` from Dialogue Engine → renders to stdout
- Calls Session Manager to list/select projects on resume

**Key tools:** `commander` or `yargs` for subcommands, `readline` for REPL loop, `chalk`/`picocolors` for color output, `ora` for spinner during LLM calls.

---

### 2. Dialogue Engine
**Responsibility:** Owns the conversation loop. Maintains turn history, builds prompts, dispatches to LLM Adapter, hands raw LLM response to Output Parser, decides when to transition clarity stages, triggers Build Mode.

**Interfaces:**
- Input: `{ userText: string, state: ProjectState, history: Turn[] }`
- Output: `{ parsed: LLMResponse, nextState: ProjectState, display: DisplayPayload }`
- Calls: LLM Adapter, Output Parser, State Manager

**Clarity stage machine:**
```
EXPLORING → NARROWING → CONFIRMING → LOCKED
```
Transition logic lives here, not in the state file.

---

### 3. LLM Adapter
**Responsibility:** Abstracts provider differences. Accepts a normalized `ChatRequest`, returns a raw string. Handles retries, timeout, and API error normalization.

**Interfaces:**
```typescript
interface LLMAdapter {
  chat(request: ChatRequest): Promise<string>
}

interface ChatRequest {
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[]
  model: string
  temperature?: number
}
```

**Implementations:** `OpenAIAdapter`, `AnthropicAdapter` — selected at startup from config. Adding a new provider = new class, no other changes.

---

### 4. Output Parser
**Responsibility:** Extracts structured sections from raw LLM text. LLM responses contain labeled blocks (`UNDERSTANDING:`, `QUESTION:`, `ONE_LINER:`, etc.). Parser splits on these markers and returns a typed object. Falls back gracefully when a section is missing.

**Interfaces:**
```typescript
interface LLMResponse {
  understanding?: string
  logicBase?: string
  question?: string
  oneLiner?: string
  clarityScore?: number   // 0-100, if LLM emits it
  raw: string             // always preserved
}

function parseResponse(raw: string): LLMResponse
```

**Pattern:** Regex-based section extraction with a known marker set. If structured output (JSON mode) is available from the provider, prefer that — wrap in same interface.

---

### 5. State Manager
**Responsibility:** Owns `state.json` schema. Reads, validates, and writes project state. Applies immutable updates (returns new state object, never mutates). Tracks the five requirement dimensions + clarity stage.

**Interfaces:**
```typescript
interface ProjectState {
  projectId: string
  createdAt: string
  updatedAt: string
  clarityStage: 'EXPLORING' | 'NARROWING' | 'CONFIRMING' | 'LOCKED'
  dimensions: {
    functional: string[]
    nonFunctional: string[]
    constraints: string[]
    userPersonas: string[]
    successCriteria: string[]
  }
  turnCount: number
}

interface StateManager {
  load(projectDir: string): Promise<ProjectState>
  save(projectDir: string, state: ProjectState): Promise<void>
  applyUpdate(state: ProjectState, patch: Partial<ProjectState>): ProjectState
}
```

**Persistence:** Atomic write via temp file + rename to avoid corruption on crash.

---

### 6. File Manager
**Responsibility:** Manages the project folder on disk. Creates project directories, writes/reads `state.json` and `history.json` (turn log), lists existing projects for resume.

**Interfaces:**
```typescript
interface FileManager {
  initProject(name: string): Promise<string>        // returns projectDir
  listProjects(): Promise<ProjectMeta[]>
  loadHistory(projectDir: string): Promise<Turn[]>
  appendTurn(projectDir: string, turn: Turn): Promise<void>
}
```

**Layout:**
```
~/.req-builder/projects/
  {project-slug}/
    state.json
    history.json
```

---

### 7. Output Compiler (Build Mode)
**Responsibility:** Reads final `ProjectState` + `history.json`, compiles three output documents. Stateless — pure function over inputs.

**Interfaces:**
```typescript
interface OutputCompiler {
  compile(state: ProjectState, history: Turn[]): CompiledOutput
}

interface CompiledOutput {
  spec: string          // spec.md content
  acceptance: string    // acceptance.md content
  tasks: string         // tasks.md content
}
```

**Output written by File Manager** to the project directory. Compiler itself does not touch disk.

---

## Data Flow

```
User types input
      │
      ▼
CLI Layer (readline)
      │  userText: string
      ▼
Dialogue Engine
      │  builds prompt from state + history
      ▼
LLM Adapter ──► OpenAI / Anthropic API
      │  raw string response
      ▼
Output Parser
      │  LLMResponse (typed sections)
      ▼
State Manager
      │  applyUpdate() → new ProjectState (immutable)
      ▼
File Manager
      │  save state.json, append history.json
      ▼
Dialogue Engine
      │  DisplayPayload { question, understanding, stage }
      ▼
CLI Layer
      │
      ▼
Terminal output
```

**Build mode diverges after state load:**
```
File Manager (load state + history)
      │
      ▼
Output Compiler (pure transform)
      │
      ▼
File Manager (write spec.md, acceptance.md, tasks.md)
      │
      ▼
CLI Layer (confirm paths to user)
```

---

## Build Order

Dependencies flow bottom-up. Build in this order:

1. **Types / interfaces** — `ProjectState`, `LLMResponse`, `Turn`, `ChatRequest`. No deps. Unblocks everything.

2. **Output Parser** — pure string → typed object. No external deps. Testable in isolation immediately.

3. **LLM Adapter** — depends only on `ChatRequest` type and provider SDKs. Can be stubbed for all other layers.

4. **State Manager** — depends on `ProjectState` type and `fs`. No LLM dependency.

5. **File Manager** — depends on `ProjectState`, `Turn`. Wraps `fs/promises`. No LLM dependency.

6. **Dialogue Engine** — depends on LLM Adapter, Output Parser, State Manager. Core logic layer.

7. **Output Compiler** — depends on `ProjectState` + `Turn[]` types only. Can be built in parallel with Dialogue Engine.

8. **CLI Layer** — depends on everything. Built last; wires all components together.

---

## Key Design Decisions

### Adapter pattern for LLM providers
One interface, multiple implementations. Config selects which adapter to instantiate at startup. New providers require zero changes to Dialogue Engine or State Manager.

### Immutable state updates
`applyUpdate()` always returns a new `ProjectState`. State Manager never mutates in place. This makes turn-by-turn diffs trivial and prevents subtle bugs from shared references.

### Output Parser as a separate layer
LLM response format will drift. Isolating parsing means the prompt format can change without touching Dialogue Engine logic. If a provider supports JSON structured output, swap the parser implementation — interface stays the same.

### Atomic file writes
`state.json` is written via temp file + `fs.rename()`. Prevents a half-written state file from corrupting a session on crash or Ctrl+C.

### Output Compiler is pure
No I/O inside the compiler. Takes state + history, returns strings. File Manager handles disk writes. This makes the compiler trivially testable and reusable (e.g., preview without writing).

### History stored separately from state
`state.json` holds only current dimensions + stage (small, fast to read/write). `history.json` holds the full turn log (grows unboundedly). Build mode needs history; the REPL loop only needs recent turns for context window management.

---

## Sources

- [Architectural Patterns for LLMs in Node.js](https://ejsit-journal.com/index.php/ejsit/article/view/737)
- [LangChain.js Structured Output Parsers](https://js.langchain.com/docs/how_to/output_parser_structured/)
- [Best Practices for LLM Output Parsing](https://reintech.io/blog/llm-output-parsing-structured-data-extraction-best-practices)
- [Node.js readline for Interactive CLIs](https://thelinuxcode.com/nodejs-readline-module-a-practical-production-oriented-guide-for-interactive-clis/)
- [Reading/Writing JSON in Node.js](https://blog.logrocket.com/reading-writing-json-files-node-js-complete-tutorial/)
- [5 Patterns for Scalable LLM Service Integration](https://latitude.so/blog/5-patterns-for-scalable-llm-service-integration/)
