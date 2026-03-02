import { promises as fs } from 'node:fs';
import path from 'node:path';
import { getProjectDir } from '../utils/paths.js';

const OPTIONAL_ARTIFACTS = ['idea.md', 'decision.md', 'decisions.md', 'notes.md'] as const;

function formatDefaultTag(date: Date): string {
  return date.toISOString().replace(/[:.]/g, '-');
}

function normalizeTag(tag: string | undefined): string {
  const value = tag?.trim();
  if (!value) {
    return formatDefaultTag(new Date());
  }

  if (!/^[A-Za-z0-9._-]+$/.test(value)) {
    throw new Error('Snapshot tag may only contain letters, numbers, ".", "_" or "-"');
  }

  return value;
}

async function exists(targetPath: string): Promise<boolean> {
  return fs
    .access(targetPath)
    .then(() => true)
    .catch(() => false);
}

export async function snapshotProject(
  projectId: string,
  useLocal: boolean,
  tag?: string
): Promise<string> {
  const projectDir = getProjectDir(projectId, useLocal);
  if (!(await exists(projectDir))) {
    throw new Error(`Project not found: ${projectId}`);
  }

  const resolvedTag = normalizeTag(tag);
  const snapshotsDir = path.join(projectDir, 'snapshots');
  const snapshotDir = path.join(snapshotsDir, resolvedTag);

  if (await exists(snapshotDir)) {
    throw new Error(`Snapshot tag already exists: ${resolvedTag}`);
  }

  await fs.mkdir(snapshotDir, { recursive: true });

  const requiredStatePath = path.join(projectDir, 'state.json');
  if (!(await exists(requiredStatePath))) {
    throw new Error(`Project state is missing for ${projectId}`);
  }
  await fs.copyFile(requiredStatePath, path.join(snapshotDir, 'state.json'));

  for (const artifact of OPTIONAL_ARTIFACTS) {
    const sourcePath = path.join(projectDir, artifact);
    if (await exists(sourcePath)) {
      await fs.copyFile(sourcePath, path.join(snapshotDir, artifact));
    }
  }

  return snapshotDir;
}
