import os from 'node:os';
import path from 'node:path';

const GLOBAL_BASE = path.join(os.homedir(), '.reqgen');

export function getBaseDir(useLocal: boolean): string {
  return useLocal ? process.cwd() : GLOBAL_BASE;
}

export function getProjectDir(projectId: string, useLocal: boolean): string {
  return path.join(getBaseDir(useLocal), 'projects', projectId);
}

export function getProjectsDir(useLocal: boolean): string {
  return path.join(getBaseDir(useLocal), 'projects');
}

export function getConfigPath(): string {
  return path.join(GLOBAL_BASE, 'config.json');
}
