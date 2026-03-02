import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createProject } from './index.js';
import { addResearchLink, addResearchNote } from './research.js';

describe('project research service', () => {
  let originalCwd: string;
  let sandboxDir: string;

  beforeEach(async () => {
    originalCwd = process.cwd();
    sandboxDir = await fs.mkdtemp(path.join(os.tmpdir(), 'reqgen-research-'));
    process.chdir(sandboxDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.rm(sandboxDir, { recursive: true, force: true });
  });

  it('appends note and link entries to research.md', async () => {
    const created = await createProject('Research target', true);

    const notePath = await addResearchNote(created.id, true, 'Need competitive benchmark notes');
    const linkPath = await addResearchLink(
      created.id,
      true,
      'https://example.com/reference',
      'Reference article',
    );
    const content = await fs.readFile(notePath, 'utf8');

    expect(notePath).toBe(linkPath);
    expect(content).toContain('# Research');
    expect(content).toContain('Need competitive benchmark notes');
    expect(content).toContain('[Reference article](https://example.com/reference)');
  });

  it('throws when project does not exist', async () => {
    await expect(addResearchNote('deadbeef-missing', true, 'x')).rejects.toThrow('Project not found');
    await expect(
      addResearchLink('deadbeef-missing', true, 'https://example.com', 'Example'),
    ).rejects.toThrow('Project not found');
  });
});
