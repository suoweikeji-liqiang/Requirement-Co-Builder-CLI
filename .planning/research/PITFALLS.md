# Domain Pitfalls

**Domain:** CLI-based AI dialogue tool (Requirement Co-Builder)
**Researched:** 2026-03-02

---

## Critical Pitfalls

### Pitfall 1: LLM Wraps JSON in Markdown Fences

**What goes wrong:** Model returns ` ```json\n{...}\n``` ` instead of raw JSON, or prepends "Here is your structured output:" before the JSON block. Standard `JSON.parse()` throws immediately.

**Why it happens:** Models are trained on markdown-heavy corpora and default to "helpful" formatting even when instructed otherwise. JSON mode / structured output APIs reduce but do not eliminate this — the model can still add a preamble before the JSON block.

**Consequences:** Every downstream parser breaks. Silent retry loops burn tokens and add latency. If retries are uncapped, costs spike.

**Prevention:**
- Strip markdown fences and leading/trailing prose before parsing: extract the first `{...}` or `[...]` block with a regex fallback.
- Use provider structured-output APIs (OpenAI `response_format: { type: "json_schema" }`) as the primary constraint, with regex extraction as the safety net.
- Validate the parsed object against a Zod schema immediately after parsing; reject and retry (max 2 retries) on schema mismatch.

**Detection:** Parser errors in logs that contain backtick characters; responses longer than expected for a structured field.

**Phase:** Address in Phase 1 (LLM integration layer) before any feature builds on top of it.

---

### Pitfall 2: Model Ignores System Prompt Constraints (Multiple Questions / Unsolicited Advice)

**What goes wrong:** The system prompt says "ask exactly one clarifying question." The model asks three, or skips the question and writes a full requirements document unprompted. Downstream state machine breaks because it expects a single `question` field.

**Why it happens:** Instruction-following degrades as conversation history grows. Early turns respect constraints; later turns drift. Smaller/cheaper models are worse at strict constraint adherence.

**Consequences:** UX feels chaotic. Structured state parsing fails. Users get overwhelmed or confused.

**Prevention:**
- Repeat the critical constraint ("ask ONE question only") in both the system prompt and as the last line of every user-turn message.
- Parse the response structurally — if `questions` array has length > 1, take only `questions[0]` and discard the rest rather than erroring.
- Add a post-parse assertion: if the response contains no question field, re-prompt once with an explicit correction message.

**Detection:** `questions.length > 1` in parsed output; `question` field missing from response schema.

**Phase:** Phase 1 (prompt engineering) and Phase 2 (dialogue state machine).

---

### Pitfall 3: Context Rot Over Long Sessions

**What goes wrong:** After 15–20 turns, the model starts ignoring earlier requirements it already confirmed, re-asking questions already answered, or contradicting its own prior summaries. Research (Chroma, 2025) shows LLM accuracy drops sharply after 60–70% of the context window is consumed — not gradually, but in sudden cliffs.

**Why it happens:** Attention mechanisms weight recent tokens more heavily. Early conversation content gets effectively "forgotten" even when technically within the window.

**Consequences:** Requirements document diverges from what the user actually said. User trust erodes. Session must be restarted.

**Prevention:**
- Maintain a rolling structured summary (`state.json`) that is injected at the top of every prompt, replacing raw history beyond the last N turns.
- Keep raw history to the last 6–8 turns; summarize older turns into the structured state object.
- Never pass the full `idea.md` content on every turn — pass only the delta (newly confirmed fields).

**Detection:** Model re-asks a question already in `state.json`; confirmed fields disappear from subsequent responses.

**Phase:** Phase 2 (context management strategy) — design this before the session gets long.

---

### Pitfall 4: State File Corruption on Crash

**What goes wrong:** The process crashes mid-write to `state.json`. The file is left truncated or with a partial JSON object. On next launch, `JSON.parse()` throws and the entire session is unrecoverable.

**Why it happens:** Node.js `fs.writeFileSync` is not atomic on any platform. A crash between open and close leaves a partial file.

**Consequences:** User loses all session progress. No recovery path.

**Prevention:**
- Write to a temp file first (`state.json.tmp`), then `fs.renameSync` to `state.json`. Rename is atomic on POSIX; on Windows it requires `fs.rename` with error handling for cross-device moves.
- On startup, check for `state.json.tmp` — if it exists and `state.json` is corrupt, recover from the temp file.
- Keep one backup: before every write, copy current `state.json` to `state.json.bak`.

**Detection:** `JSON.parse` throws on `state.json` at startup; file size is 0 or truncated mid-object.

**Phase:** Phase 1 (state persistence layer).

---

## Moderate Pitfalls

### Pitfall 5: State Drift Between state.json and idea.md

**What goes wrong:** `state.json` is the source of truth for the dialogue engine, but `idea.md` is regenerated from it. If a bug causes them to diverge (e.g., `idea.md` is written but `state.json` write fails), the user sees one thing in the file but the model operates on different data.

**Prevention:**
- Treat `state.json` as the single source of truth. Generate `idea.md` deterministically from `state.json` on every write — never update `idea.md` independently.
- Write both files in the same atomic operation sequence: write `state.json` first (with temp-file pattern), then regenerate `idea.md`.

**Phase:** Phase 1 (state design) — establish the single-source-of-truth rule before writing any persistence code.

---

### Pitfall 6: Blocking REPL on LLM Response

**What goes wrong:** The CLI sends a request and freezes with no output until the full response arrives (3–10 seconds). Users assume it crashed and hit Ctrl+C.

**Why it happens:** Using `await llm.complete()` without streaming, then printing the full result.

**Consequences:** 53% of users abandon apps that feel unresponsive for >3 seconds (Google UX research, 2025). Ctrl+C mid-request leaves state in an inconsistent intermediate state.

**Prevention:**
- Use streaming (`stream: true`) for all conversational turns. Print tokens to stdout as they arrive.
- Show a spinner or "Thinking..." indicator immediately on request start, before the first token arrives, to cover Time to First Token (TTFT).
- Handle `SIGINT` during streaming: flush partial response, do not write partial state.

**Detection:** User feedback about freezing; absence of any stdout output during LLM call.

**Phase:** Phase 1 (LLM client implementation).

---

### Pitfall 7: Windows Path Separator Bugs

**What goes wrong:** Code uses string concatenation (`dir + '/' + file`) or hardcodes forward slashes. On Windows, this produces paths like `C:/Users/foo/project/state.json` which Node.js tolerates in most cases, but shell commands, `child_process.exec`, and some native modules do not.

**Prevention:**
- Use `path.join()` and `path.resolve()` everywhere. Never concatenate path segments manually.
- Use `os.homedir()` for home directory resolution — never hardcode `~` or `$HOME` (both fail on Windows without shell expansion).
- Test path-dependent code on Windows explicitly; CI should include a Windows runner.

**Detection:** `ENOENT` errors on Windows that don't reproduce on macOS/Linux; paths with mixed separators in logs.

**Phase:** Phase 1 (file I/O utilities) — establish path helpers before any file operations are written.

---

### Pitfall 8: CJK / Unicode Terminal Encoding

**What goes wrong:** On Windows, the default console code page (CP936 for Chinese, CP932 for Japanese) mangles non-ASCII characters. A requirement written in Chinese appears as mojibake in the terminal and may corrupt `idea.md` if the file is written with the wrong encoding.

**Prevention:**
- Set `process.stdout` encoding explicitly; use `chcp 65001` guidance in the README for Windows users.
- Always write files with `{ encoding: 'utf8' }` explicitly — never rely on the default.
- Test with CJK input strings in CI on Windows.

**Detection:** Garbled characters in terminal output on Windows; file content differs from what was typed.

**Phase:** Phase 1 (I/O layer) and README setup instructions.

---

## Minor Pitfalls

### Pitfall 9: Token Limit Exceeded Mid-Response

**What goes wrong:** A long session hits the model's output token limit mid-sentence. The response is truncated, the JSON is incomplete, and parsing fails.

**Prevention:**
- Set `max_tokens` conservatively for structured responses (e.g., 512 for a single question + updated state).
- Check `finish_reason === 'length'` in the API response; if truncated, retry with a prompt asking the model to complete only the JSON object.

**Phase:** Phase 1 (LLM client).

---

### Pitfall 10: Unhelpful Error Messages on LLM Failure

**What goes wrong:** API rate limit, network timeout, or invalid API key surfaces as a raw stack trace or a cryptic `401 Unauthorized` with no guidance.

**Prevention:**
- Catch all LLM client errors at the boundary. Map known error codes to user-friendly messages: "Rate limit reached — waiting 10s before retry", "Invalid API key — check your OPENAI_API_KEY environment variable".
- Never let a raw HTTP error or stack trace reach the user's terminal.

**Phase:** Phase 1 (error handling layer).

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|---|---|---|
| LLM client setup | JSON wrapped in markdown fences | Regex extraction + Zod validation + 2-retry limit |
| Prompt design | Model asks multiple questions | Constraint repetition + take `questions[0]` defensively |
| State persistence | Crash corrupts state.json | Atomic write via temp file + .bak copy |
| Dialogue loop | Context rot after turn 15+ | Rolling summary injected at prompt top; cap raw history |
| REPL I/O | Blocking on LLM response | Stream tokens; show spinner for TTFT gap |
| File I/O utilities | Windows path separator bugs | `path.join` everywhere; `os.homedir()` for home dir |
| Terminal output | CJK encoding on Windows | Explicit UTF-8 encoding on all file writes |
| Error handling | Raw stack traces on API failure | Map all LLM errors to user-friendly messages |

---

## Sources

- [LLM Structured Outputs: The Infrastructure Behind Reliable AI](https://logic.inc/resources/llm-structured-outputs)
- [How Structured Outputs and Constrained Decoding Work](https://www.letsdatascience.com/blog/structured-outputs-making-llms-return-reliable-json)
- [JSON Hardening Patterns](https://json-parser.net/blog/llm-tool-calling-json-hardening)
- [Context Rot: Why AI Performance Drops in Long Chats](https://www.chaseai.io/blog/context-rot-guide)
- [Context Is the New Bottleneck](https://sfailabs.com/guides/how-to-manage-context-when-developing-with-ai) — Chroma Research 2025: performance cliff at 60–70% context fill
- [Real-Time Streaming LLM Inference Guide 2026](https://iterathon.tech/blog/real-time-streaming-llm-inference-guide-2026) — 53% abandonment rate >3s
- [Building Real-Time User Experiences](https://getathenic.com/blog/streaming-llm-responses-real-time-ux) — TTFT target <500ms
- [Writing cross-platform Node.js](https://shapeshed.com/writing-cross-platform-node/)
- [Cross-platform Node.js path handling](https://thelinuxcode.com/nodejs-pathjoin-a-practical-crossplatform-guide/)
