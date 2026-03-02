import { promises as fs } from 'node:fs';
import path from 'node:path';
import { readProjectState } from '../state/index.js';
import type { ProjectState } from '../state/schema.js';
import { getProjectDir } from '../utils/paths.js';

export interface CompiledOutputPaths {
  specPath: string;
  acceptancePath: string;
  tasksPath: string;
}

function readOpenPoints(state: ProjectState): string[] {
  const points: string[] = [];
  if (!state.projection || state.projection.boundary.trim().length === 0) {
    points.push('Confirm system boundaries and excluded scenarios.');
  }
  if (!state.lastCompression || state.lastCompression.oneLiner.trim().length === 0) {
    points.push('Create a one-line scope statement.');
  }
  if (points.length === 0) {
    points.push('Refine open points from current compression.');
  }
  return points;
}

function renderSpec(state: ProjectState): string {
  const projection = state.projection;
  const compression = state.lastCompression;

  return [
    '# Spec',
    '',
    `## Project`,
    `- ID: ${state.id}`,
    `- Idea: ${state.idea}`,
    `- Stage: ${state.clarityStage}`,
    '',
    '## Projection',
    `- Context: ${projection?.context ?? ''}`,
    `- Actors: ${projection?.actors ?? ''}`,
    `- Intent: ${projection?.intent ?? ''}`,
    `- Mechanism: ${projection?.mechanism ?? ''}`,
    `- Boundary: ${projection?.boundary ?? ''}`,
    '',
    '## Compression',
    `- One-liner: ${compression?.oneLiner ?? ''}`,
    '',
    '### Three-liner',
    compression?.threeLiner ?? '',
    '',
    '### Structured',
    '```json',
    compression?.structured ?? '{}',
    '```',
    '',
  ].join('\n');
}

function renderAcceptance(state: ProjectState): string {
  const warnings = state.lastGuardWarnings ?? [];
  const assumptions = state.lastBusinessAssumptions ?? [];

  const lines: string[] = [
    '# Acceptance Criteria',
    '',
    `- Clarity stage is \`${state.clarityStage}\``,
    '- Output artifacts exist: `spec.md`, `acceptance.md`, `tasks.md`',
  ];

  if (assumptions.length > 0) {
    lines.push('', '### Business Assumptions', ...assumptions.map((value) => `- ${value}`));
  }

  if (warnings.length > 0) {
    lines.push('', '### Guard Warnings', ...warnings.map((value) => `- ${value}`));
  }

  lines.push('');
  return lines.join('\n');
}

function renderTasks(state: ProjectState): string {
  const openPoints = readOpenPoints(state);
  const oneLiner = state.lastCompression?.oneLiner?.trim();

  const lines: string[] = ['# Tasks', ''];
  if (oneLiner) {
    lines.push(`- Align implementation with scope: ${oneLiner}`);
  }
  lines.push('- Refine open points from current compression.');
  lines.push(...openPoints.map((value) => `- ${value}`));
  lines.push('');
  return lines.join('\n');
}

async function loadProjectState(projectId: string, useLocal: boolean): Promise<{
  projectDir: string;
  state: ProjectState;
}> {
  const projectDir = getProjectDir(projectId, useLocal);
  const state = await readProjectState(projectDir);
  if (!state) {
    throw new Error(`Project not found: ${projectId}`);
  }

  return { projectDir, state };
}

export async function compileProjectOutput(
  projectId: string,
  useLocal: boolean,
): Promise<CompiledOutputPaths> {
  const { projectDir, state } = await loadProjectState(projectId, useLocal);
  const specPath = path.resolve(projectDir, 'spec.md');
  const acceptancePath = path.resolve(projectDir, 'acceptance.md');
  const tasksPath = path.resolve(projectDir, 'tasks.md');

  await Promise.all([
    fs.writeFile(specPath, renderSpec(state), 'utf8'),
    fs.writeFile(acceptancePath, renderAcceptance(state), 'utf8'),
    fs.writeFile(tasksPath, renderTasks(state), 'utf8'),
  ]);

  return { specPath, acceptancePath, tasksPath };
}
