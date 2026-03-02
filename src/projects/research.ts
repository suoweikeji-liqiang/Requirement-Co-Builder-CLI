import { promises as fs } from 'node:fs';
import path from 'node:path';
import { readProjectState } from '../state/index.js';
import { getProjectDir } from '../utils/paths.js';

async function ensureProjectExists(projectId: string, useLocal: boolean): Promise<string> {
  const projectDir = getProjectDir(projectId, useLocal);
  const state = await readProjectState(projectDir);
  if (!state) {
    throw new Error(`Project not found: ${projectId}`);
  }
  return projectDir;
}

async function ensureResearchHeader(researchPath: string): Promise<void> {
  const exists = await fs
    .access(researchPath)
    .then(() => true)
    .catch(() => false);
  if (!exists) {
    await fs.writeFile(researchPath, '# Research\n\n', 'utf8');
  }
}

function buildTimestamp(): string {
  return new Date().toISOString();
}

export async function addResearchNote(
  projectId: string,
  useLocal: boolean,
  note: string,
): Promise<string> {
  const trimmedNote = note.trim();
  if (!trimmedNote) {
    throw new Error('Research note is required');
  }

  const projectDir = await ensureProjectExists(projectId, useLocal);
  const researchPath = path.join(projectDir, 'research.md');
  await ensureResearchHeader(researchPath);

  const entry = `## ${buildTimestamp()}\n- Note: ${trimmedNote}\n\n`;
  await fs.appendFile(researchPath, entry, 'utf8');

  return researchPath;
}

export async function addResearchLink(
  projectId: string,
  useLocal: boolean,
  url: string,
  title: string,
): Promise<string> {
  const trimmedUrl = url.trim();
  const trimmedTitle = title.trim();

  if (!trimmedUrl) {
    throw new Error('Research link URL is required');
  }
  if (!trimmedTitle) {
    throw new Error('Research link title is required');
  }

  const projectDir = await ensureProjectExists(projectId, useLocal);
  const researchPath = path.join(projectDir, 'research.md');
  await ensureResearchHeader(researchPath);

  const entry = `## ${buildTimestamp()}\n- Link: [${trimmedTitle}](${trimmedUrl})\n\n`;
  await fs.appendFile(researchPath, entry, 'utf8');

  return researchPath;
}
