import type { ClarityStage } from './model.js';
import type { Message } from '../state/schema.js';

const ABSTRACT_WORDS = ['better', 'best', 'optimal', 'advanced', 'improved'];
const LOGIC_CONNECTORS = ['because', 'therefore', 'so that', 'due to', 'as a result'];
const ARCHITECTURE_WORDS = ['microservice', 'kubernetes', 'redis', 'database schema', 'event bus'];
const BUSINESS_WORDS = ['revenue', 'budget', 'pay', 'roi', 'customer acquisition', 'profit'];

export interface StagePolicyResult {
  blocked: boolean;
  reason?: string;
  sanitized: string;
}

export interface RhythmResult {
  consecutiveAssistantTurns: number;
  isDominant: boolean;
}

export function detectAbstractEvaluativeLanguage(text: string): string[] {
  const lower = text.toLowerCase();
  const hits = ABSTRACT_WORDS.filter((word) => lower.includes(word));
  const hasLogic = LOGIC_CONNECTORS.some((connector) => lower.includes(connector));

  if (hits.length === 0 || hasLogic) {
    return [];
  }
  return hits.map((word) => `Abstract evaluative term without logic support: ${word}`);
}

export function enforceStagePolicy(stage: ClarityStage, text: string): StagePolicyResult {
  const lower = text.toLowerCase();
  const hasArchitectureAdvice = ARCHITECTURE_WORDS.some((word) => lower.includes(word));
  const blocked = hasArchitectureAdvice && (stage === 'concept' || stage === 'direction');

  if (!blocked) {
    return { blocked: false, sanitized: text };
  }

  return {
    blocked: true,
    reason: 'Architecture suggestions are blocked before structure stage.',
    sanitized: 'Architecture details are deferred until the structure stage.',
  };
}

export function detectModelDominantRhythm(messages: Message[]): RhythmResult {
  let consecutiveAssistantTurns = 0;
  for (let index = messages.length - 1; index >= 0; index--) {
    if (messages[index].role !== 'assistant') {
      break;
    }
    consecutiveAssistantTurns++;
  }

  return {
    consecutiveAssistantTurns,
    isDominant: consecutiveAssistantTurns >= 3,
  };
}

export function detectBusinessAssumptions(text: string): string[] {
  const lower = text.toLowerCase();
  const assumptions: string[] = [];

  for (const word of BUSINESS_WORDS) {
    if (lower.includes(word)) {
      assumptions.push(`Business assumption detected: ${word}`);
    }
  }

  return assumptions;
}
