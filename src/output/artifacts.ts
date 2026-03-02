import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { ProjectState } from '../state/schema.js';

const DECISION_SIGNAL = /\b(confirm|confirmed|decide|decision|change|changed|update|updated|modify|modified)\b/i;

export interface DecisionEntryInput {
  userInput: string;
  assistantText: string;
  timestamp?: string;
}

export interface SyncRoundArtifactsInput extends DecisionEntryInput {
  state: ProjectState;
}

function normalizeLine(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function readOpenPoints(state: ProjectState): string[] {
  const points: string[] = [];
  const projection = state.projection;

  if (!projection?.context?.trim()) {
    points.push('Clarify the operational context.');
  }
  if (!projection?.actors?.trim()) {
    points.push('Identify primary actors.');
  }
  if (!projection?.boundary?.trim()) {
    points.push('Define boundaries and exclusions.');
  }
  if ((state.lastGuardWarnings ?? []).length > 0) {
    points.push(...(state.lastGuardWarnings ?? []));
  }

  if (points.length === 0) {
    points.push('Refine open points from current compression.');
  }

  return points;
}

function renderIdeaMarkdown(state: ProjectState): string {
  const compression = state.lastCompression;
  const openPoints = readOpenPoints(state);
  const projection = state.projection;

  return [
    '# Idea',
    '',
    `## Project`,
    `- ID: ${state.id}`,
    `- Idea: ${state.idea}`,
    '',
    '## One-Liner',
    compression?.oneLiner ?? '',
    '',
    '## Projection',
    `- Context: ${projection?.context ?? ''}`,
    `- Actors: ${projection?.actors ?? ''}`,
    `- Intent: ${projection?.intent ?? ''}`,
    `- Mechanism: ${projection?.mechanism ?? ''}`,
    `- Boundary: ${projection?.boundary ?? ''}`,
    '',
    '## Three-Liner',
    compression?.threeLiner ?? '',
    '',
    '## Structured',
    '```json',
    compression?.structured ?? '{}',
    '```',
    '',
    '## Stage',
    state.clarityStage,
    '',
    '## Open Points',
    ...openPoints.map((value) => `- ${value}`),
    '',
  ].join('\n');
}

export async function writeIdeaArtifact(projectDir: string, state: ProjectState): Promise<string> {
  const ideaPath = path.join(projectDir, 'idea.md');
  await fs.writeFile(ideaPath, renderIdeaMarkdown(state), 'utf8');
  return ideaPath;
}

export async function appendDecisionEntry(
  projectDir: string,
  input: DecisionEntryInput,
): Promise<boolean> {
  const combined = `${input.userInput}\n${input.assistantText}`;
  if (!DECISION_SIGNAL.test(combined)) {
    return false;
  }

  const decisionsPath = path.join(projectDir, 'decisions.md');
  const timestamp = input.timestamp ?? new Date().toISOString();
  const hasFile = await fs
    .access(decisionsPath)
    .then(() => true)
    .catch(() => false);

  if (!hasFile) {
    await fs.writeFile(decisionsPath, '# Decisions\n\n', 'utf8');
  }

  const entry = [
    `## ${timestamp}`,
    `- User: ${normalizeLine(input.userInput)}`,
    `- Assistant: ${normalizeLine(input.assistantText)}`,
    '',
  ].join('\n');
  await fs.appendFile(decisionsPath, entry, 'utf8');

  return true;
}

export async function syncRoundArtifacts(
  projectDir: string,
  input: SyncRoundArtifactsInput,
): Promise<{ ideaPath: string; decisionAppended: boolean }> {
  const ideaPath = await writeIdeaArtifact(projectDir, input.state);
  const decisionAppended = await appendDecisionEntry(projectDir, input);
  return { ideaPath, decisionAppended };
}
