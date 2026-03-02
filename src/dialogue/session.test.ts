import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createInitialState } from '../state/index.js';
import { syncSessionArtifacts } from './session.js';

describe('session artifact sync', () => {
  let sandboxDir: string;

  beforeEach(async () => {
    sandboxDir = await fs.mkdtemp(path.join(os.tmpdir(), 'reqgen-session-artifacts-'));
  });

  afterEach(async () => {
    await fs.rm(sandboxDir, { recursive: true, force: true });
  });

  it('writes idea.md after a persisted round', async () => {
    const state = createInitialState('proj-session', 'Build onboarding flow', true);
    state.lastCompression = {
      oneLiner: 'Simplify onboarding choices.',
      threeLiner: 'Capture user role.\nApply template.\nConfirm setup path.',
      structured: '{"objective":"onboarding"}',
    };

    await syncSessionArtifacts(
      sandboxDir,
      state,
      'I confirm this onboarding flow.',
      'Confirmed, we can keep this as the current decision.',
    );

    const ideaExists = await fs
      .access(path.join(sandboxDir, 'idea.md'))
      .then(() => true)
      .catch(() => false);
    const decisionsExists = await fs
      .access(path.join(sandboxDir, 'decisions.md'))
      .then(() => true)
      .catch(() => false);

    expect(ideaExists).toBe(true);
    expect(decisionsExists).toBe(true);
  });
});
