export interface LogicPremise {
  premise: string;
  source: 'user' | 'assistant' | 'inference';
}

export interface CompressionOutput {
  oneLiner: string;
  threeLiner: string;
  structured: string;
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[。！？.!?])\s+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

export function buildCompression(text: string): CompressionOutput {
  const sentences = splitSentences(text);
  const oneLiner = sentences[0] ?? text.trim();
  const three = sentences.slice(0, 3);
  while (three.length < 3) {
    three.push(three[three.length - 1] ?? oneLiner);
  }
  const threeLiner = three.join('\n');
  const structured = JSON.stringify({ oneLiner, threeLiner }, null, 2);

  return {
    oneLiner,
    threeLiner,
    structured,
  };
}

export function buildLogicBase(userInput: string, assistantOutput: string): LogicPremise[] {
  const premises: LogicPremise[] = [];
  if (userInput.trim()) {
    premises.push({ premise: userInput.trim(), source: 'user' });
  }
  if (assistantOutput.trim()) {
    premises.push({ premise: assistantOutput.trim(), source: 'assistant' });
  }
  if (premises.length > 0) {
    premises.push({
      premise: 'The next round should clarify one unresolved point.',
      source: 'inference',
    });
  }
  return premises;
}

export function enforceSingleQuestion(text: string): string {
  let seenQuestion = false;
  let normalized = '';

  for (const char of text) {
    if (char === '?' || char === '？') {
      if (!seenQuestion) {
        normalized += '?';
        seenQuestion = true;
      } else {
        normalized += '.';
      }
    } else {
      normalized += char;
    }
  }

  return normalized;
}

export function formatLogicBaseBlock(premises: LogicPremise[]): string {
  if (premises.length === 0) {
    return 'LOGIC_BASE:\n- (none)';
  }
  const lines = premises.map((entry) => `- [${entry.source}] ${entry.premise}`);
  return `LOGIC_BASE:\n${lines.join('\n')}`;
}
