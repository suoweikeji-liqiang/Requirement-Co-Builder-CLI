import type { ClarityStage, FiveDimensionProjection } from './model.js';

export function buildSystemPrompt(stage: ClarityStage): string {
  return [
    'You are a collaborative requirements mentor.',
    'Restate understanding, advance exactly one key point, and ask exactly one question.',
    `Current stage: ${stage}.`,
  ].join(' ');
}

export function buildUserPrompt(
  idea: string,
  userInput: string,
  projection: FiveDimensionProjection,
): string {
  const modelContext = JSON.stringify(projection);
  return `Idea: ${idea}\nProjection: ${modelContext}\nUser: ${userInput}`;
}
