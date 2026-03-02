import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createProject } from '../projects/index.js';
import { writeProjectState } from '../state/index.js';
import { compileProjectOutput } from './compile.js';

describe('project output compiler', () => {
  let originalCwd: string;
  let sandboxDir: string;

  beforeEach(async () => {
    originalCwd = process.cwd();
    sandboxDir = await fs.mkdtemp(path.join(os.tmpdir(), 'reqgen-compile-'));
    process.chdir(sandboxDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.rm(sandboxDir, { recursive: true, force: true });
  });

  it('writes spec, acceptance, and tasks markdown files from project state', async () => {
    const created = await createProject('Build a scheduling assistant', true);
    await writeProjectState(created.projectDir, {
      ...created.state,
      clarityStage: 'structure',
      projection: {
        context: 'Scheduling for support teams',
        actors: 'support manager and agents',
        intent: 'reduce missed handoffs',
        mechanism: 'shared queue with SLA reminders',
        boundary: 'email and chat channels only',
      },
      lastCompression: {
        oneLiner: 'Unify support handoffs in one queue.',
        threeLiner: 'Capture requests.\nRoute by SLA.\nTrack handoff completion.',
        structured: '{"goal":"support handoff quality"}',
      },
      lastGuardWarnings: ['Avoid architecture details before executable stage.'],
      lastBusinessAssumptions: ['Teams will use SLA labels consistently.'],
    });

    const output = await compileProjectOutput(created.id, true);
    const [spec, acceptance, tasks] = await Promise.all([
      fs.readFile(output.specPath, 'utf8'),
      fs.readFile(output.acceptancePath, 'utf8'),
      fs.readFile(output.tasksPath, 'utf8'),
    ]);

    expect(path.isAbsolute(output.specPath)).toBe(true);
    expect(path.isAbsolute(output.acceptancePath)).toBe(true);
    expect(path.isAbsolute(output.tasksPath)).toBe(true);

    expect(spec).toContain('# Spec');
    expect(spec).toContain('Build a scheduling assistant');
    expect(spec).toContain('## Projection');
    expect(spec).toContain('shared queue with SLA reminders');

    expect(acceptance).toContain('# Acceptance Criteria');
    expect(acceptance).toContain('Clarity stage is `structure`');
    expect(acceptance).toContain('### Guard Warnings');

    expect(tasks).toContain('# Tasks');
    expect(tasks).toContain('Refine open points from current compression');
  });

  it('throws when compiling outputs for a missing project', async () => {
    await expect(compileProjectOutput('deadbeef-missing', true)).rejects.toThrow('Project not found');
  });
});
