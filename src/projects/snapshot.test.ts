import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createProject } from './index.js';
import { snapshotProject } from './snapshot.js';

describe('project snapshots', () => {
  let originalCwd: string;
  let sandboxDir: string;

  beforeEach(async () => {
    originalCwd = process.cwd();
    sandboxDir = await fs.mkdtemp(path.join(os.tmpdir(), 'reqgen-snapshot-'));
    process.chdir(sandboxDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.rm(sandboxDir, { recursive: true, force: true });
  });

  it('creates a snapshot directory with required artifacts', async () => {
    const created = await createProject('Snapshot target', true);
    await fs.writeFile(path.join(created.projectDir, 'idea.md'), '# idea', 'utf8');

    const snapshotDir = await snapshotProject(created.id, true, 'v1');
    const stateExists = await fs
      .access(path.join(snapshotDir, 'state.json'))
      .then(() => true)
      .catch(() => false);

    expect(stateExists).toBe(true);
  });

  it('throws when project does not exist', async () => {
    await expect(snapshotProject('deadbeef-missing', true, 'v1')).rejects.toThrow('Project not found');
  });

  it('fails deterministically on duplicate tags', async () => {
    const created = await createProject('Duplicate tag project', true);
    await snapshotProject(created.id, true, 'dup');
    await expect(snapshotProject(created.id, true, 'dup')).rejects.toThrow(
      'Snapshot tag already exists',
    );
  });
});
