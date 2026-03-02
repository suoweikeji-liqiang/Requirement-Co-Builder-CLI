import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createInitialState, readProjectState, writeProjectState } from '../state/index.js';
import type { ProjectState } from '../state/schema.js';
import { generateProjectId } from '../utils/id.js';
import { getProjectDir, getProjectsDir } from '../utils/paths.js';
import type { CreatedProject, ProjectListItem } from './schema.js';

async function ensureUniqueProjectId(idea: string, useLocal: boolean): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const id = generateProjectId(idea);
    const projectDir = getProjectDir(id, useLocal);
    const exists = await fs.access(projectDir).then(() => true).catch(() => false);
    if (!exists) {
      return id;
    }
  }
  throw new Error('Failed to generate unique project id');
}

export async function createProject(idea: string, useLocal: boolean): Promise<CreatedProject> {
  const trimmedIdea = idea.trim();
  if (!trimmedIdea) {
    throw new Error('Idea is required');
  }

  const id = await ensureUniqueProjectId(trimmedIdea, useLocal);
  const projectDir = getProjectDir(id, useLocal);
  await fs.mkdir(projectDir, { recursive: true });

  const state = createInitialState(id, trimmedIdea, useLocal);
  await writeProjectState(projectDir, state);

  return { id, projectDir, state };
}

export async function listProjects(useLocal: boolean): Promise<ProjectListItem[]> {
  const projectsDir = getProjectsDir(useLocal);
  const entries = await fs
    .readdir(projectsDir, { withFileTypes: true })
    .catch((err: NodeJS.ErrnoException) => {
      if (err.code === 'ENOENT') {
        return [] as Array<{ isDirectory(): boolean; name: string }>;
      }
      throw err;
    });

  const projects: ProjectListItem[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const projectDir = path.join(projectsDir, entry.name);
    const state = await readProjectState(projectDir);
    if (!state) {
      continue;
    }

    projects.push({
      id: state.id,
      idea: state.idea,
      clarityStage: state.clarityStage,
      updatedAt: state.updatedAt,
      projectDir,
    });
  }

  projects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return projects;
}

export async function openProject(projectId: string, useLocal: boolean): Promise<ProjectState> {
  const projectDir = getProjectDir(projectId, useLocal);
  const state = await readProjectState(projectDir);
  if (!state) {
    throw new Error(`Project not found: ${projectId}`);
  }
  return state;
}

export async function deleteProject(projectId: string, useLocal: boolean): Promise<void> {
  const projectDir = getProjectDir(projectId, useLocal);
  const exists = await fs.access(projectDir).then(() => true).catch(() => false);
  if (!exists) {
    throw new Error(`Project not found: ${projectId}`);
  }
  await fs.rm(projectDir, { recursive: true, force: false });
}
