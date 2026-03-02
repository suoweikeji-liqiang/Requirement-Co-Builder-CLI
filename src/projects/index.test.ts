import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createProject, deleteProject, listProjects, openProject } from './index.js';

describe('projects service', () => {
  let originalCwd: string;
  let sandboxDir: string;

  beforeEach(async () => {
    originalCwd = process.cwd();
    sandboxDir = await fs.mkdtemp(path.join(os.tmpdir(), 'reqgen-projects-'));
    process.chdir(sandboxDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.rm(sandboxDir, { recursive: true, force: true });
  });

  it('creates a project and returns id and directory', async () => {
    const created = await createProject('Build a CLI tool', true);
    expect(created.id).toMatch(/^[0-9a-f]{4}-[a-z0-9-]+$/);

    const statePath = path.join(created.projectDir, 'state.json');
    const exists = await fs.access(statePath).then(() => true).catch(() => false);
    expect(exists).toBe(true);
  });

  it('lists projects sorted by updatedAt descending', async () => {
    const first = await createProject('First project', true);
    await new Promise((resolve) => setTimeout(resolve, 5));
    const second = await createProject('Second project', true);

    const projects = await listProjects(true);
    expect(projects.length).toBeGreaterThanOrEqual(2);
    expect(projects[0].id).toBe(second.id);
    expect(projects.map((p: { id: string }) => p.id)).toContain(first.id);
  });

  it('opens an existing project state', async () => {
    const created = await createProject('Open me', true);
    const opened = await openProject(created.id, true);
    expect(opened.id).toBe(created.id);
    expect(opened.idea).toBe('Open me');
  });

  it('throws when opening a missing project', async () => {
    await expect(openProject('deadbeef-missing', true)).rejects.toThrow('Project not found');
  });

  it('deletes an existing project directory', async () => {
    const created = await createProject('Delete me', true);
    await deleteProject(created.id, true);

    const exists = await fs.access(created.projectDir).then(() => true).catch(() => false);
    expect(exists).toBe(false);
  });
});
