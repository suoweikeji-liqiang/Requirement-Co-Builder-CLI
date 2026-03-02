import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createInitialState } from '../state/index.js';
import { appendDecisionEntry, writeIdeaArtifact } from './artifacts.js';

describe('output artifacts', () => {
  let sandboxDir: string;

  beforeEach(async () => {
    sandboxDir = await fs.mkdtemp(path.join(os.tmpdir(), 'reqgen-artifacts-'));
  });

  afterEach(async () => {
    await fs.rm(sandboxDir, { recursive: true, force: true });
  });

  it('writes idea.md with fixed sections', async () => {
    const state = createInitialState('proj-artifact', 'Build customer support workflow', true);
    state.clarityStage = 'direction';
    state.lastCompression = {
      oneLiner: 'Unify support work intake.',
      threeLiner: 'Capture requests.\nPrioritize by SLA.\nResolve with ownership.',
      structured: '{"scope":"support queue"}',
    };
    state.lastGuardWarnings = ['Avoid architecture details before structure stage.'];
    state.projection = {
      context: 'Support operations',
      actors: 'manager and agents',
      intent: 'reduce missed replies',
      mechanism: 'single triage queue',
      boundary: '',
    };

    const ideaPath = await writeIdeaArtifact(sandboxDir, state);
    const content = await fs.readFile(ideaPath, 'utf8');

    expect(content).toContain('# Idea');
    expect(content).toContain('## One-Liner');
    expect(content).toContain('## Three-Liner');
    expect(content).toContain('## Structured');
    expect(content).toContain('## Stage');
    expect(content).toContain('## Open Points');
    expect(content).toContain('single triage queue');
  });

  it('appends a timestamped decision entry on confirmation/modification signals', async () => {
    const appended = await appendDecisionEntry(sandboxDir, {
      userInput: 'I confirm this scope for now.',
      assistantText: 'Great, we will keep this decision and move to next detail.',
    });

    const decisionsPath = path.join(sandboxDir, 'decisions.md');
    const content = await fs.readFile(decisionsPath, 'utf8');
    expect(appended).toBe(true);
    expect(content).toContain('# Decisions');
    expect(content).toContain('I confirm this scope for now.');
  });

  it('does not append decisions.md when no decision signal appears', async () => {
    const appended = await appendDecisionEntry(sandboxDir, {
      userInput: 'Tell me more about constraints.',
      assistantText: 'What part should we clarify first?',
    });

    const decisionsPath = path.join(sandboxDir, 'decisions.md');
    const exists = await fs.access(decisionsPath).then(() => true).catch(() => false);
    expect(appended).toBe(false);
    expect(exists).toBe(false);
  });
});
