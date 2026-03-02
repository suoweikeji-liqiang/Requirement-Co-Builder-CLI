export type ExplainTrigger = '/explain' | '/deep-dive' | '/later';

export interface ExplainDirective {
  trigger: ExplainTrigger;
  remainder: string;
}

const EXPLAIN_TRIGGERS: ExplainTrigger[] = ['/explain', '/deep-dive', '/later'];

const CONFIDENCE_BY_TRIGGER: Record<ExplainTrigger, 'high' | 'medium' | 'low'> = {
  '/deep-dive': 'high',
  '/explain': 'medium',
  '/later': 'low',
};

function toSentences(content: string): string[] {
  const normalized = content.trim().replace(/\s+/g, ' ');
  if (!normalized) {
    return ['No explanation available.'];
  }

  const parts = normalized
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  if (parts.length > 0) {
    return parts;
  }

  return [normalized.endsWith('.') ? normalized : `${normalized}.`];
}

function capToThreeSentences(content: string): string {
  return toSentences(content).slice(0, 3).join(' ');
}

export function parseExplainDirective(input: string): ExplainDirective | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) {
    return null;
  }

  const [candidate, ...rest] = trimmed.split(/\s+/);
  if (!EXPLAIN_TRIGGERS.includes(candidate as ExplainTrigger)) {
    return null;
  }

  return {
    trigger: candidate as ExplainTrigger,
    remainder: rest.join(' ').trim(),
  };
}

export function buildTriggeredExplanation(
  userInput: string,
  assistantText: string,
): string | null {
  const directive = parseExplainDirective(userInput);
  if (!directive) {
    return null;
  }

  const confidence = CONFIDENCE_BY_TRIGGER[directive.trigger];
  const source = assistantText.trim() || directive.remainder;
  const summary = capToThreeSentences(source);

  return `KNOWLEDGE_EXPLANATION [confidence: ${confidence}]\n${summary}`;
}
